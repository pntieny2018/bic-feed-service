import { CONTENT_TARGET, ORDER, PRIVACY } from '@beincom/constants';
import { getDatabaseConfig } from '@libs/database/postgres/config';
import { REPORT_SCOPE, ReportAttribute } from '@libs/database/postgres/model';
import { LibReportDetailRepository, LibReportRepository } from '@libs/database/postgres/repository';
import { SentryService } from '@libs/infra/sentry';
import { GROUP_SERVICE_TOKEN, IGroupService } from '@libs/service/group';
import { UserDto } from '@libs/service/user';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import { isBoolean, uniq } from 'lodash';
import {
  FindAttributeOptions,
  FindOptions,
  Includeable,
  Op,
  QueryTypes,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NIL } from 'uuid';

import { EntityIdDto, PageDto } from '../../common/dto';
import { ArrayHelper } from '../../common/helpers';
import { CategoryModel } from '../../database/models/category.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { CommentModel } from '../../database/models/comment.model';
import { LinkPreviewModel } from '../../database/models/link-preview.model';
import { PostCategoryModel } from '../../database/models/post-category.model';
import { IPostGroup, PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { PostSeriesModel } from '../../database/models/post-series.model';
import { PostTagModel } from '../../database/models/post-tag.model';
import {
  IPost,
  PostModel,
  PostPrivacy,
  PostStatus,
  PostType,
} from '../../database/models/post.model';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { UserSavePostModel } from '../../database/models/user-save-post.model';
import { UserSeenPostModel } from '../../database/models/user-seen-post.model';
import { ArticleResponseDto, ItemInSeriesResponseDto } from '../article/dto/responses';
import { CommentService } from '../comment';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { MediaDto } from '../media/dto';
import { MentionService } from '../mention';
import { TagService } from '../tag/tag.service';
import { RULES } from '../v2-post/constant';
import {
  ContentEmptyContentException,
  ContentNotFoundException,
  ContentAccessDeniedException,
  ContentEmptyGroupException,
  ContentLimitAttachedSeriesException,
} from '../v2-post/domain/exception';

import { GetPostDto } from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostResponseDto } from './dto/responses';
import { PostBindingService } from './post-binding.service';
import { PostHelper } from './post.helper';

@Injectable()
export class PostService {
  /**
   * Logger
   * @protected
   */
  protected logger = new Logger(PostService.name);

  protected classTransformer = new ClassTransformer();

  public constructor(
    @InjectConnection()
    protected sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    protected postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    protected postGroupModel: typeof PostGroupModel,
    @InjectModel(PostSeriesModel)
    protected postSeriesModel: typeof PostSeriesModel,
    @InjectModel(PostCategoryModel)
    protected postCategoryModel: typeof PostCategoryModel,
    @InjectModel(PostTagModel)
    protected postTagModel: typeof PostTagModel,
    @InjectModel(UserMarkReadPostModel)
    protected userMarkReadPostModel: typeof UserMarkReadPostModel,
    @InjectModel(UserSavePostModel)
    protected userSavePostModel: typeof UserSavePostModel,
    @Inject(GROUP_SERVICE_TOKEN)
    protected groupAppService: IGroupService,
    protected mentionService: MentionService,
    @Inject(forwardRef(() => CommentService))
    protected commentService: CommentService,
    protected readonly sentryService: SentryService,
    protected readonly postBinding: PostBindingService,
    protected readonly linkPreviewService: LinkPreviewService,
    protected readonly tagService: TagService,
    @InjectModel(UserSeenPostModel)
    protected userSeenPostModel: typeof UserSeenPostModel,
    private readonly _libReportRepo: LibReportRepository,
    private readonly _libReportDetailRepo: LibReportDetailRepository
  ) {}

  /**
   * Get Draft Posts
   */
  public async getDrafts(
    authUserId: string,
    getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<ArticleResponseDto>> {
    const { limit, offset, order, isProcessing, type } = getDraftPostDto;
    const condition = {
      createdBy: authUserId,
      status: PostStatus.DRAFT,
    };

    if (type) {
      condition['type'] = type;
    }

    if (isProcessing) {
      condition.status = PostStatus.PROCESSING;
    }

    const result = await this.getsAndCount(condition, order, { limit, offset });

    return new PageDto<ArticleResponseDto>(result.data, {
      total: result.count,
      limit,
      offset,
    });
  }

  public async getsAndCount(
    condition: WhereOptions<IPost>,
    order?: ORDER,
    otherParams?: FindOptions
  ): Promise<{ data: ArticleResponseDto[]; count: number }> {
    const attributes = this.getAttributesObj({ loadMarkRead: false });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: false,
      shouldIncludeGroup: true,
      shouldIncludeCategory: true,
    });
    const orderOption = [];
    if (
      condition['status'] &&
      PostHelper.scheduleTypeStatus.some((e) => condition['status'].includes(e))
    ) {
      orderOption.push(['publishedAt', order]);
    } else {
      orderOption.push(['createdAt', order]);
    }
    const rows = await this.postModel.findAll<PostModel>({
      where: condition,
      attributes,
      include,
      subQuery: false,
      order: orderOption,
      ...otherParams,
    });
    const jsonArticles = rows.map((r) => r.toJSON());
    const articlesBindedData = await this.postBinding.bindRelatedData(jsonArticles, {
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: false,
    });

    await this.postBinding.bindCommunity(articlesBindedData);

    const result = this.classTransformer.plainToInstance(ArticleResponseDto, articlesBindedData, {
      excludeExtraneousValues: true,
    });
    const total = await this.postModel.count<PostModel>({
      where: condition,
      attributes,
      include: otherParams.include ? otherParams.include : include,
      distinct: true,
    });

    return {
      data: result,
      count: total,
    };
  }

  /**
   * Get Post
   * @param postId string
   * @param user MediaDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async get(
    postId: string,
    user: UserDto,
    getPostDto?: GetPostDto,
    shouldHideSecretAudienceCanNotAccess?: boolean
  ): Promise<PostResponseDto> {
    const attributes = this.getAttributesObj({
      loadMarkRead: true,
      loadSaved: true,
      authUserId: user?.id || null,
    });
    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: true,
      shouldIncludeGroup: true,
      shouldIncludePreviewLink: true,
      shouldIncludeSeries: true,
      authUserId: user?.id || null,
    });

    const post = PostHelper.filterArchivedPost(
      await this.postModel.findOne({
        attributes,
        where: { id: postId },
        include,
      })
    );

    if (!post || (post.isHidden === true && post.createdBy !== user?.id)) {
      throw new ContentNotFoundException();
    }

    let comments = null;
    if (getPostDto?.withComment && post.canComment) {
      comments = await this.commentService.getComments(
        {
          postId,
          parentId: NIL,
          childLimit: getPostDto.childCommentLimit,
          order: getPostDto.commentOrder,
          childOrder: getPostDto.childCommentOrder,
          limit: getPostDto.commentLimit,
        },
        user,
        false
      );
    }
    const jsonPost = post.toJSON();
    const postsBindedData = await this.postBinding.bindRelatedData([jsonPost], {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: shouldHideSecretAudienceCanNotAccess ?? true,
      authUser: user,
    });

    await this.postBinding.bindCommunity(postsBindedData);
    const result = this.classTransformer.plainToInstance(PostResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
    });

    result[0]['comments'] = comments;

    return result[0];
  }

  public getAttributesObj(options?: {
    loadMarkRead?: boolean;
    loadSaved?: boolean;
    authUserId?: string;
  }): FindAttributeOptions {
    const attributes: FindAttributeOptions = { exclude: ['updatedBy'] };
    const include = [];
    if (options?.authUserId && options?.loadMarkRead) {
      include.push(PostModel.loadMarkReadPost(options.authUserId));
    }
    if (options?.authUserId && options?.loadSaved) {
      include.push(PostModel.loadSaved(options.authUserId));
    }
    include.push(['tags_json', 'tags'], ['media_json', 'media'], ['cover_json', 'coverMedia']);

    attributes.include = include;
    return attributes;
  }

  public async getListWithGroupsByIds(postIds: string[], must: boolean): Promise<IPost[]> {
    const postGroups = await this.postModel.findAll({
      attributes: [
        'id',
        'title',
        'type',
        'content',
        'lang',
        'status',
        'createdBy',
        'createdAt',
        'updatedAt',
      ],
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: must,
          attributes: ['groupId'],
          where: { isArchived: false },
        },
        {
          model: PostTagModel,
          as: 'postTags',
          required: false,
          attributes: ['tagId'],
        },
        {
          model: PostSeriesModel,
          required: false,
          as: 'postSeries',
          attributes: ['seriesId'],
        },
      ],
      where: {
        id: postIds,
      },
    });

    return postGroups;
  }

  public async getItemsInSeries(
    seriesId: string,
    authUser: UserDto
  ): Promise<ItemInSeriesResponseDto[]> {
    const itemsInSeries = await this.postSeriesModel.findAll({
      where: {
        seriesId,
      },
      order: [
        ['zindex', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });

    const postIdsReported = await this.getEntityIdsReportedByUser(authUser.id, [
      CONTENT_TARGET.ARTICLE,
      CONTENT_TARGET.POST,
    ]);
    const articleIdsSorted = itemsInSeries
      .filter((item) => !postIdsReported.includes(item.postId))
      .map((item) => item.postId);
    const items = await this.getItemsInSeriesByIds(articleIdsSorted, authUser.id);
    const itemsBindedData = await this.postBinding.bindRelatedData(items, {
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: false,
    });

    return this.classTransformer.plainToInstance(ItemInSeriesResponseDto, itemsBindedData, {
      excludeExtraneousValues: true,
    });
  }

  public async getItemsInSeriesByIds(ids: string[], authUserId = null): Promise<IPost[]> {
    const include = this.getIncludeObj({
      shouldIncludeCategory: true,
      mustIncludeGroup: true,
      authUserId: authUserId ?? null,
    });

    const attributes: any = {
      include: [
        ['media_json', 'media'],
        ['cover_json', 'coverMedia'],
      ],
    };
    if (authUserId) {
      attributes.include.push(PostModel.loadSaved(authUserId));
      attributes.include.push(PostModel.loadMarkReadPost(authUserId));
      attributes.include.push(PostModel.loadSaved(authUserId));
    }
    const rows = await this.postModel.findAll({
      attributes,
      include,
      where: {
        id: ids,
        isHidden: false,
        status: PostStatus.PUBLISHED,
      },
    });

    const mappedPosts = [];
    for (const id of ids) {
      const post = rows.find((row) => row.id === id);
      if (post) {
        mappedPosts.push(post.toJSON());
      }
    }

    return mappedPosts;
  }

  public getIncludeObj({
    mustIncludeGroup = false,
    mustInSeriesIds,
    shouldIncludeCategory,
    shouldIncludeOwnerReaction,
    shouldIncludeGroup,
    shouldIncludePreviewLink,
    shouldIncludeArticlesInSeries,
    shouldIncludeSeries,
    filterCategoryIds,
    authUserId,
    filterGroupIds,
  }: {
    mustIncludeGroup?: boolean;
    mustInSeriesIds?: string[];
    shouldIncludeCategory?: boolean;
    shouldIncludeOwnerReaction?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludePreviewLink?: boolean;
    shouldIncludeArticlesInSeries?: boolean;
    shouldIncludeSeries?: boolean;
    filterCategoryIds?: string[];
    filterGroupIds?: string[];
    authUserId?: string;
  }): Includeable[] {
    const includes: Includeable[] = [];
    if (shouldIncludeGroup || mustIncludeGroup) {
      const obj = {
        model: PostGroupModel,
        as: 'groups',
        required: mustIncludeGroup,
        attributes: ['groupId', 'isArchived', 'isPinned'],
        where: { isArchived: false },
      };
      if (filterGroupIds) {
        obj['where']['groupId'] = filterGroupIds;
      }
      includes.push(obj);
    }

    if (shouldIncludePreviewLink) {
      includes.push({
        model: LinkPreviewModel,
        as: 'linkPreview',
        required: false,
      });
    }
    if (shouldIncludeArticlesInSeries) {
      includes.push({
        model: PostModel,
        as: 'items',
        required: false,
        through: {
          attributes: ['zindex', 'createdAt'],
        },
        attributes: [
          'id',
          'title',
          'summary',
          [
            Sequelize.literal(
              `CASE WHEN "items".type = '${PostType.POST}' THEN "items".content ELSE null END`
            ),
            'content',
          ],
          'createdBy',
          'canComment',
          'canReact',
          'importantExpiredAt',
          'type',
          ['media_json', 'media'],
        ],
        where: {
          status: PostStatus.PUBLISHED,
          isHidden: false,
        },
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
            required: true,
            attributes: [],
            where: { isArchived: false },
          },
        ],
      });
    }
    if (shouldIncludeOwnerReaction && authUserId) {
      includes.push({
        model: PostReactionModel,
        as: 'ownerReactions',
        required: false,
        where: {
          createdBy: authUserId,
        },
      });
    }

    if (shouldIncludeCategory) {
      const obj = {
        model: CategoryModel,
        as: 'categories',
        required: false,
        through: {
          attributes: [],
        },
        attributes: ['id', 'name'],
      };
      if (filterCategoryIds) {
        obj['where'] = {
          id: filterCategoryIds,
        };
      }

      includes.push(obj);
    }

    if (shouldIncludeSeries) {
      includes.push({
        model: PostModel,
        as: 'series',
        required: false,
        through: {
          attributes: ['zindex'],
        },
        attributes: ['id', 'title', 'createdBy'],
        include: [
          {
            model: PostGroupModel,
            required: true,
            attributes: [],
            where: { isArchived: false },
          },
        ],
      });
    }

    if (mustInSeriesIds) {
      includes.push({
        model: PostSeriesModel,
        required: true,
        where: {
          seriesId: mustInSeriesIds,
        },
        attributes: ['seriesId', 'zindex', 'createdAt'],
      });
    }
    return includes;
  }

  public async getPrivacy(groupIds: string[]): Promise<PostPrivacy> {
    if (groupIds.length === 0) {
      throw new ContentEmptyGroupException();
    }
    const groups = await this.groupAppService.findAllByIds(groupIds);
    let totalPrivate = 0;
    let totalOpen = 0;
    for (const group of groups) {
      if (group.privacy === PRIVACY.OPEN) {
        return PostPrivacy.OPEN;
      }
      if (group.privacy === PRIVACY.CLOSED) {
        totalOpen++;
      }
      if (group.privacy === PRIVACY.PRIVATE) {
        totalPrivate++;
      }
    }

    if (totalOpen > 0) {
      return PostPrivacy.CLOSED;
    }
    if (totalPrivate > 0) {
      return PostPrivacy.PRIVATE;
    }
    return PostPrivacy.SECRET;
  }

  /**
   * Delete post
   */
  public async delete(post: IPost, authUser: UserDto): Promise<IPost> {
    try {
      const postId = post.id;
      await this.postModel.destroy({
        where: {
          id: postId,
          createdBy: authUser.id,
        },
      });

      return post;
    } catch (error) {
      this.logger.error(error, error?.stack);
      throw error;
    }
  }
  /**
   * Add group to post
   * @param groupIds Array of Group ID
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addGroup(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (groupIds.length === 0) {
      return;
    }
    const postGroupDataCreate = groupIds.map((groupId) => ({
      postId: postId,
      groupId,
    }));
    await this.postGroupModel.bulkCreate(postGroupDataCreate, { transaction });
  }

  /**
   * Delete/Insert group by post
   */
  public async setGroupByPost(
    groupIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<boolean> {
    const currentGroups = await this.postGroupModel.findAll({
      where: { postId },
    });
    const currentGroupIds = currentGroups.map((i) => i.groupId);

    const deleteGroupIds = ArrayHelper.arrDifferenceElements(currentGroupIds, groupIds);
    if (deleteGroupIds.length) {
      await this.postGroupModel.destroy({
        where: { groupId: deleteGroupIds, postId },
        transaction,
      });
    }

    const addGroupIds = ArrayHelper.arrDifferenceElements(groupIds, currentGroupIds);
    if (addGroupIds.length) {
      await this.postGroupModel.bulkCreate(
        addGroupIds.map((groupId) => ({
          postId,
          groupId,
        })),
        { transaction }
      );
    }
    return true;
  }

  public async findPost(entity: EntityIdDto): Promise<IPost> {
    let conditions = {};
    if (entity.postId) {
      conditions = {
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
          },
        ],
        where: {
          id: entity.postId,
        },
      };
    }

    if (entity.commentId) {
      conditions = {
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
          },
          {
            model: CommentModel,
            as: 'comments',
            where: {
              id: entity.commentId,
            },
          },
        ],
      };
    }
    if (entity.reactionPostId) {
      conditions = {
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
          },
          {
            model: PostReactionModel,
            as: 'reactions',
            where: {
              id: entity.reactionPostId,
            },
          },
        ],
      };
    }

    if (entity.reactionCommentId) {
      conditions = {
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
          },
          {
            model: CommentModel,
            as: 'comments',
            include: [
              {
                model: CommentReactionModel,
                as: 'reactions',
                where: {
                  id: entity.reactionCommentId,
                },
              },
            ],
          },
        ],
      };
    }

    const post = await this.postModel.findOne(conditions);

    if (!post) {
      throw new ContentNotFoundException();
    }
    return post.toJSON();
  }

  public async findPostByIds(ids: string[]): Promise<IPost[]> {
    const posts = await this.postModel.findAll({
      where: {
        id: ids,
      },
    });
    return posts;
  }

  public async markRead(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findByPk(postId);
    if (!post) {
      throw new ContentNotFoundException();
    }
    if (post && post.createdBy === userId) {
      throw new ContentAccessDeniedException();
    }
    const readPost = await this.userMarkReadPostModel.findOne({
      where: {
        postId,
        userId,
      },
    });
    if (!readPost) {
      await this.userMarkReadPostModel.bulkCreate(
        [
          {
            postId,
            userId,
          },
        ],
        { ignoreDuplicates: true }
      );
    }
  }

  public async getListByUserId(
    userId: string,
    search: {
      offset: number;
      limit: number;
      type?: PostType;
      groupIds?: string[];
    }
  ): Promise<string[]> {
    if (!userId) {
      return [];
    }
    const { type, offset, limit, groupIds } = search;
    const condition = {
      status: PostStatus.PUBLISHED,
      isHidden: false,
      createdBy: userId,
    };

    if (type) {
      condition['type'] = type;
    }
    const include = [];
    if (groupIds) {
      include.push({
        model: PostGroupModel,
        as: 'groups',
        required: true,
        attributes: [],
        where: {
          groupId: groupIds,
          isArchived: false,
        },
      });
    }
    const posts = await this.postModel.findAll({
      attributes: ['id'],
      subQuery: false,
      include,
      where: condition,
      order: [['createdAt', 'DESC']],
      offset,
      limit: limit + 1,
    });

    return posts.map((post) => post.id);
  }

  public async getListSavedByUserId(
    userId: string,
    search: {
      offset: number;
      limit: number;
      type?: PostType;
      groupIds?: string[];
    }
  ): Promise<string[]> {
    if (!userId) {
      return [];
    }
    const { groupIds, type, offset, limit } = search;
    const condition = {
      status: PostStatus.PUBLISHED,
      isHidden: false,
    };

    if (type) {
      condition['type'] = type;
    }

    const include: any = [
      {
        model: UserSavePostModel,
        required: true,
        attributes: [],
        where: {
          userId,
        },
      },
    ];

    if (groupIds) {
      include.push({
        model: PostGroupModel,
        as: 'groups',
        required: true,
        attributes: [],
        where: {
          groupId: groupIds,
          isArchived: false,
        },
      });
    }
    const posts = await this.postModel.findAll({
      attributes: ['id'],
      subQuery: false,
      include,
      where: condition,
      order: [[this.sequelizeConnection.literal('"userSavePosts".created_at'), 'DESC']],
      offset,
      limit: limit + 1,
    });

    return posts.map((post) => post.id);
  }

  public async savePostToUserCollection(postId: string, userId: string): Promise<void> {
    const savePost = await this.userSavePostModel.findOne({
      where: {
        postId,
        userId,
      },
    });
    if (!savePost) {
      try {
        await this.userSavePostModel.create({
          postId,
          userId,
        });
      } catch (e) {}
    }
  }

  public async unSavePostToUserCollection(postId: string, userId: string): Promise<void> {
    const checkExist = await this.userSavePostModel.findOne({
      where: {
        postId,
        userId,
      },
    });
    if (checkExist) {
      try {
        await this.userSavePostModel.destroy({
          where: {
            postId,
            userId,
          },
        });
      } catch (e) {}
    }
  }

  public async checkExistAndPublished(id: string): Promise<void> {
    const post = await this.postModel.findOne({
      where: {
        id,
        status: PostStatus.PUBLISHED,
      },
    });
    if (!post) {
      throw new ContentNotFoundException();
    }
  }

  public async getsByMedia(id: string): Promise<PostResponseDto[]> {
    const include = this.getIncludeObj({
      shouldIncludeGroup: true,
      shouldIncludeSeries: true,
    });
    const posts = await this.postModel.findAll({
      attributes: {
        include: [
          ['tags_json', 'tags'],
          ['media_json', 'media'],
        ],
      },
      include,
      where: {
        videoIdProcessing: id,
      },
    });

    const jsonPosts = posts.map((p) => p.toJSON());

    const postsBindedData = await this.postBinding.bindRelatedData(jsonPosts, {
      shouldBindAudience: true,
      shouldBindMention: true,
      shouldBindActor: true,
    });

    return this.classTransformer.plainToInstance(PostResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
    });
  }

  public checkContent(content: string, media: MediaDto): void {
    if (
      !content &&
      media?.files.length === 0 &&
      media?.videos.length === 0 &&
      media?.images.length === 0
    ) {
      throw new ContentEmptyContentException();
    }
  }

  public async updatePrivacy(postId: string): Promise<void> {
    const post = await this.findPost({ postId });
    if (post.groups.length === 0) {
      return;
    }
    const groupIds = post.groups.map((g) => g.groupId);
    const privacy = await this.getPrivacy(groupIds);
    await this.postModel.update(
      { privacy },
      {
        where: {
          id: postId,
        },
      }
    );
  }

  public async updateData(postIds: string[], data: Partial<IPost>): Promise<void> {
    await this.postModel.update(data, {
      where: {
        id: {
          [Op.in]: postIds,
        },
      },
    });
  }

  public async getPostsByIds(
    ids: string[],
    userId: string | null,
    isPostOnly = false
  ): Promise<IPost[]> {
    if (ids.length === 0) {
      return [];
    }

    const include = this.getIncludeObj({
      shouldIncludeCategory: true,
      shouldIncludeGroup: true,
      shouldIncludeOwnerReaction: true,
      shouldIncludePreviewLink: true,
      shouldIncludeArticlesInSeries: true,
      mustIncludeGroup: true,
      authUserId: userId,
    });
    const conditions = {
      id: ids,
    };

    if (isPostOnly) {
      conditions['type'] = PostType.POST;
    }

    const rows = await this.postModel.findAll({
      subQuery: false,
      attributes: {
        include: [
          ['tags_json', 'tags'],
          ['media_json', 'media'],
          ['cover_json', 'coverMedia'],
          PostModel.loadMarkReadPost(userId),
          PostModel.loadSaved(userId),
        ],
      },
      include,
      where: conditions,
    });

    const articleOrPostIdsReported = await this.getEntityIdsReportedByUser(userId, [
      CONTENT_TARGET.ARTICLE,
      CONTENT_TARGET.POST,
    ]);
    const mappedPosts = [];
    for (const postId of ids) {
      const post = rows.find((row) => row.id === postId);
      if (post) {
        const postJson = post.toJSON();
        postJson.items = postJson.items.filter(
          (item) => !articleOrPostIdsReported.includes(item.id)
        );
        mappedPosts.push(postJson);
      }
    }
    return mappedPosts;
  }

  public async getSimplePostsByIds(ids: string[]): Promise<IPost[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.postModel.findAll({
      attributes: [
        'id',
        'title',
        [
          Sequelize.literal(
            `CASE WHEN "PostModel".type = '${PostType.POST}' THEN "PostModel".content ELSE null END`
          ),
          'content',
        ],
        'summary',
        'createdBy',
        'canComment',
        'canReact',
        'importantExpiredAt',
        'type',
        ['media_json', 'media'],
      ],
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: true,
          attributes: [],
          where: { isArchived: false },
        },
      ],
      where: {
        id: ids,
        isHidden: false,
        status: PostStatus.PUBLISHED,
      },
    });

    const mappedPosts = [];
    for (const id of ids) {
      const post = rows.find((row) => row.id === id);
      if (post) {
        mappedPosts.push(post.toJSON());
      }
    }

    return mappedPosts;
  }

  public async getIdsPinnedInGroup(groupId: string, userId: string): Promise<string[]> {
    const { schema } = getDatabaseConfig();
    let condition = ` pg.group_id =:groupId AND pg.is_archived = false`;
    if (userId) {
      condition += ` AND is_pinned = TRUE
            AND NOT EXISTS(
           SELECT null
           FROM ${schema}.report_content_details r
             WHERE r.created_by =:userId AND r.target_id = p.id
           )`;
    }
    const posts = await this.sequelizeConnection.query<{ id: string }>(
      `
    SELECT id
    FROM ${schema}.posts p
    INNER JOIN ${schema}.posts_groups pg ON pg.post_id = p.id
    WHERE ${condition}
    ORDER BY pg.pinned_index ASC
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          userId,
          groupId,
        },
      }
    );
    return posts.map((post) => post.id);
  }

  public async getTotalDraft(user: UserDto): Promise<number> {
    return this.postModel.count({
      where: {
        status: PostStatus.DRAFT,
        createdBy: user.id,
      },
    });
  }

  public async getTotalPostByGroupIds(
    groupIds: string[]
  ): Promise<{ groupId: string; totalPost: number; totalArticle: number; totalSeries: number }[]> {
    const sequelize = this.sequelizeConnection;
    const countByGroups: IPostGroup[] = await this.postGroupModel.findAll({
      raw: true,
      attributes: [
        'groupId',
        [sequelize.literal(`SUM(CASE WHEN type = 'POST' THEN 1 ELSE 0 END)`), 'totalPost'],
        [sequelize.literal(`SUM(CASE WHEN type = 'ARTICLE' THEN 1 ELSE 0 END)`), 'totalArticle'],
        [sequelize.literal(`SUM(CASE WHEN type = 'SERIES' THEN 1 ELSE 0 END)`), 'totalSeries'],
      ],
      include: [
        {
          model: PostModel,
          attributes: [],
          required: false,
          where: {
            status: PostStatus.PUBLISHED,
          },
        },
      ],
      where: {
        groupId: groupIds,
      },
      group: [`"PostGroupModel"."group_id"`],
    });

    return groupIds.map((groupId) => {
      const findGroup = countByGroups.find((group) => group.groupId === groupId);
      if (findGroup) {
        return {
          groupId,
          totalPost: findGroup.totalPost || 0,
          totalArticle: findGroup.totalArticle || 0,
          totalSeries: findGroup.totalSeries || 0,
        };
      }
      return {
        groupId,
        totalPost: 0,
        totalArticle: 0,
        totalSeries: 0,
      };
    });
  }

  public async isExisted(id: string, returning = false): Promise<[boolean, IPost]> {
    const conditions = {
      id: id,
      status: PostStatus.PUBLISHED,
    };

    if (returning) {
      const post = await this.postModel.findOne({
        include: ['groups'],
        where: conditions,
      });
      if (post) {
        return [true, post];
      }
      return [false, null];
    }

    const postCount = await this.postModel.count({
      where: conditions,
    });
    return [postCount > 1, null];
  }

  public async getEntityIdsReportedByUser(
    userId: string,
    targetTypes: CONTENT_TARGET[],
    options?: {
      reportTo?: REPORT_SCOPE;
      groupIds?: string[];
    }
  ): Promise<string[]> {
    if (!userId) {
      return [];
    }

    const reportDetails = await this._libReportDetailRepo.findMany({
      where: { reporterId: userId },
      select: ['id'],
    });

    if (!reportDetails?.length) {
      return [];
    }

    const reportIds = reportDetails.map((reportDetail) => reportDetail.id);
    const condition: WhereOptions<ReportAttribute> = { id: reportIds };
    if (options?.groupIds?.length) {
      condition.groupId = options.groupIds;
    }
    if (targetTypes?.length) {
      condition.targetType = targetTypes;
    }

    const reports = await this._libReportRepo.findMany({ where: condition, select: ['targetId'] });

    return uniq(reports.map((report) => report.targetId));
  }

  public async getPostsByFilter(
    params: {
      createdBy?: string;
      groupIds?: string[];
      status?: PostStatus[];
    },
    sort: {
      sortColumn: string;
      sortBy: 'ASC' | 'DESC';
      limit: number;
      offset: number;
    }
  ): Promise<IPost[]> {
    const { groupIds, status, createdBy } = params;
    const { sortColumn, sortBy, limit, offset } = sort;
    const conditionGroup = { isArchived: false };
    const findOption: FindOptions = {
      include: [],
      where: {},
    };
    if (groupIds) {
      conditionGroup['groupId'] = groupIds;
    }
    if (status) {
      findOption.where['status'] = status;
    }
    if (createdBy) {
      findOption.where['createdBy'] = createdBy;
    }
    if (sortColumn && sortBy) {
      findOption.order =
        sortColumn === 'publishedAt'
          ? [
              [sortColumn, sortBy],
              ['createdAt', sortBy],
            ]
          : [[sortColumn, sortBy]];
    }
    findOption.limit = limit ?? 10;
    findOption.offset = offset ?? 0;
    findOption.include = [
      {
        model: PostGroupModel,
        as: 'groups',
        required: true,
        attributes: ['groupId'],
        where: conditionGroup,
      },
    ];
    return this.postModel.findAll(findOption);
  }

  public async getPinnedList(groupId: string, user: UserDto): Promise<ArticleResponseDto[]> {
    const ids = await this.getIdsPinnedInGroup(groupId, user?.id || null);
    if (ids.length === 0) {
      return [];
    }
    const posts = await this.getPostsByIds(ids, user?.id || null);
    const postsBindedData = await this.postBinding.bindRelatedData(posts, {
      shouldBindReaction: true,
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: true,
      authUser: user,
    });

    await this.postBinding.bindCommunity(posts);
    return this.classTransformer.plainToInstance(ArticleResponseDto, postsBindedData, {
      excludeExtraneousValues: true,
    });
  }

  public async pinPostToGroupIds(
    postId: string,
    groupIds: string[]
  ): Promise<[number, IPostGroup[]]> {
    if (groupIds.length === 0) {
      return;
    }
    const { schema } = getDatabaseConfig();
    const postGroupTableName = PostGroupModel.tableName;
    this.postGroupModel.sequelize.query(
      `
        UPDATE ${schema}.${postGroupTableName} t1 
        SET is_pinned = TRUE, 
        pinned_index = (select MAX(pinned_index) FROM ${schema}.${postGroupTableName} t2 where t2.group_id = t1.group_id) + 1
        WHERE post_id = :postId AND group_id IN(:groupIds)
    `,
      {
        replacements: {
          postId,
          groupIds,
        },
      }
    );
  }

  public async unpinPostToGroupIds(
    postId: string,
    groupIds: string[]
  ): Promise<[number, IPostGroup[]]> {
    if (groupIds.length === 0) {
      return;
    }
    const { schema } = getDatabaseConfig();
    const postGroupTableName = PostGroupModel.tableName;
    this.postGroupModel.sequelize.query(
      `
        UPDATE ${schema}.${postGroupTableName} t1 
        SET is_pinned = FALSE, pinned_index = 0
        WHERE post_id = :postId AND group_id IN(:groupIds)
    `,
      {
        replacements: {
          postId,
          groupIds,
        },
      }
    );
  }

  public async getPinnedPostGroupsByGroupId(groupId: string): Promise<IPostGroup[]> {
    const postGroups = await this.postGroupModel.findAll({
      where: {
        groupId,
        isPinned: true,
      },
      include: [
        {
          model: PostModel,
          as: 'post',
          required: true,
          attributes: [],
          where: {
            status: PostStatus.PUBLISHED,
            isHidden: false,
          },
        },
      ],
    });
    return postGroups;
  }

  public async reorderPinnedPostGroups(groupId: string, postIds: string[]): Promise<void> {
    const reorderExecute = postIds.map((postId, index) => {
      return this.postGroupModel.update(
        {
          pinnedIndex: index + 1,
        },
        {
          where: {
            groupId,
            postId,
          },
        }
      );
    });
    await Promise.all(reorderExecute);
  }

  public async getGroupsByPostId(id: string): Promise<IPost> {
    const post = await this.postModel.findOne({
      attributes: ['id'],
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: true,
          attributes: ['groupId', 'isPinned'],
          where: {
            isArchived: false,
          },
        },
      ],
      where: {
        id,
        isHidden: false,
      },
    });

    return post;
  }

  public async markSeenPost(postId: string, userId: string): Promise<void> {
    try {
      const exist = await this.userSeenPostModel.findOne({
        where: {
          postId: postId,
          userId: userId,
        },
      });
      if (!exist) {
        await this.userSeenPostModel.bulkCreate(
          [
            {
              postId: postId,
              userId: userId,
            },
          ],
          { ignoreDuplicates: true }
        );
      }
    } catch (ex) {
      this.logger.error(JSON.stringify(ex?.stack));
      this.sentryService.captureException(ex);
    }
  }

  public async getPostsWithSeries(ids: string[], groupArchived?: boolean): Promise<IPost[]> {
    const { schema } = getDatabaseConfig();
    const postGroupTableName = PostGroupModel.tableName;
    const include = [];
    include.push({
      model: PostSeriesModel,
      required: false,
      as: 'postSeries',
      attributes: ['seriesId'],
      where: isBoolean(groupArchived)
        ? Sequelize.literal(
            `EXISTS (
                SELECT seriesGroups.post_id FROM ${schema}.${postGroupTableName} as seriesGroups
                  WHERE seriesGroups.post_id = "postSeries".series_id  AND seriesGroups.is_archived = ${groupArchived})`
          )
        : undefined,
    });
    const result = await this.postModel.findAll({
      include,
      where: {
        id: ids,
      },
    });

    return result;
  }

  public async validateLimitedToAttachSeries(id: string): Promise<void> {
    const post = (await this.getPostsWithSeries([id]))[0];
    const isOverLimitedToAttachSeries = post.postSeries.length > RULES.LIMIT_ATTACHED_SERIES;

    if (isOverLimitedToAttachSeries) {
      throw new ContentLimitAttachedSeriesException(RULES.LIMIT_ATTACHED_SERIES);
    }
  }
}
