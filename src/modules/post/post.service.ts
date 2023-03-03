import { SentryService } from '@app/sentry';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer } from 'class-transformer';
import {
  FindAttributeOptions,
  FindOptions,
  Includeable,
  Op,
  Transaction,
  WhereOptions,
} from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { NIL } from 'uuid';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { EntityIdDto, OrderEnum, PageDto } from '../../common/dto';
import { LogicException } from '../../common/exceptions';
import { ArrayHelper, ExceptionHelper } from '../../common/helpers';
import { CategoryModel } from '../../database/models/category.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { CommentModel } from '../../database/models/comment.model';
import { LinkPreviewModel } from '../../database/models/link-preview.model';
import { MediaModel, MediaStatus } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { PostCategoryModel } from '../../database/models/post-category.model';
import { IPostGroup, PostGroupModel } from '../../database/models/post-group.model';
import { PostHashtagModel } from '../../database/models/post-hashtag.model';
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
import { ReportContentDetailModel } from '../../database/models/report-content-detail.model';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { UserNewsFeedModel } from '../../database/models/user-newsfeed.model';
import { UserSavePostModel } from '../../database/models/user-save-post.model';
import { GroupService } from '../../shared/group';
import { GroupPrivacy } from '../../shared/group/dto';
import { UserService } from '../../shared/user';
import { UserDto } from '../auth';
import { CommentService } from '../comment';
import { FeedService } from '../feed/feed.service';
import { LinkPreviewService } from '../link-preview/link-preview.service';
import { MediaService } from '../media';
import { MediaDto } from '../media/dto';
import { EntityType } from '../media/media.constants';
import { MentionService } from '../mention';
import { ReactionService } from '../reaction';
import { ReportTo, TargetType } from '../report-content/contstants';
import { CreatePostDto, GetPostDto, UpdatePostDto } from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostResponseDto } from './dto/responses';
import { PostBindingService } from './post-binding.service';
import { PostHelper } from './post.helper';
import { PostsArchivedOrRestoredByGroupEventPayload } from '../../events/post/payload/posts-archived-or-restored-by-group-event.payload';
import { ModelHelper } from '../../common/helpers/model.helper';
import { TagService } from '../tag/tag.service';

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
    @InjectModel(PostHashtagModel)
    protected postHashtagModel: typeof PostHashtagModel,
    @InjectModel(PostTagModel)
    protected postTagModel: typeof PostTagModel,
    @InjectModel(UserMarkReadPostModel)
    protected userMarkReadPostModel: typeof UserMarkReadPostModel,
    @InjectModel(UserSavePostModel)
    protected userSavePostModel: typeof UserSavePostModel,
    protected userService: UserService,
    protected groupService: GroupService,
    protected mediaService: MediaService,
    protected mentionService: MentionService,
    @Inject(forwardRef(() => CommentService))
    protected commentService: CommentService,
    @Inject(forwardRef(() => ReactionService))
    protected reactionService: ReactionService,
    @Inject(forwardRef(() => FeedService))
    protected feedService: FeedService,
    protected readonly sentryService: SentryService,
    protected readonly postBinding: PostBindingService,
    protected readonly linkPreviewService: LinkPreviewService,
    @InjectModel(ReportContentDetailModel)
    protected readonly reportContentDetailModel: typeof ReportContentDetailModel,
    protected readonly tagService: TagService
  ) {}

  /**
   * Get Draft Posts
   */
  public async getDrafts(
    authUserId: string,
    getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset, order, isProcessing } = getDraftPostDto;
    const condition = {
      createdBy: authUserId,
      status: PostStatus.DRAFT,
      type: PostType.POST,
    };

    if (isProcessing) condition.status = PostStatus.PROCESSING;

    const result = await this.getsAndCount(condition, order, { limit, offset });

    return new PageDto<PostResponseDto>(result.data, {
      total: result.count,
      limit,
      offset,
    });
  }

  public async getsAndCount(
    condition: WhereOptions<IPost>,
    order?: OrderEnum,
    otherParams?: FindOptions
  ): Promise<{ data: PostResponseDto[]; count: number }> {
    const attributes = this.getAttributesObj({ loadMarkRead: false });

    const include = this.getIncludeObj({
      shouldIncludeOwnerReaction: false,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      shouldIncludeCover: true,
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
      attributes,
      where: condition,
      include,
      order: orderOption,
      ...otherParams,
    });
    const jsonPosts = rows.map((r) => r.toJSON());
    const postsBindedData = await this.postBinding.bindRelatedData(jsonPosts, {
      shouldBindActor: true,
      shouldBindMention: true,
      shouldBindAudience: true,
      shouldHideSecretAudienceCanNotAccess: false,
    });

    await this.postBinding.bindCommunity(postsBindedData);

    return {
      data: this.classTransformer.plainToInstance(PostResponseDto, postsBindedData, {
        excludeExtraneousValues: true,
      }),
      count: await this.postModel.count<PostModel>({
        where: condition,
        attributes,
        include: otherParams.include ? otherParams.include : include,
        distinct: true,
      }),
    };
  }

  /**
   * Get Post
   * @param postId string
   * @param user UserDto
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
      shouldIncludeMention: true,
      shouldIncludeMedia: true,
      shouldIncludePreviewLink: true,
      shouldIncludeSeries: true,
      authUserId: user?.id || null,
    });
    let condition;
    if (user) {
      condition = {
        id: postId,
        [Op.or]: [{ status: PostStatus.PUBLISHED }, { createdBy: user.id }],
      };
    } else {
      condition = { id: postId, isHidden: false };
    }

    const post = PostHelper.filterArchivedPost(
      await this.postModel.findOne({
        attributes,
        where: condition,
        include,
      })
    );

    if (!post || (post.isHidden === true && post.createdBy !== user?.id)) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
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

  protected getAttributesObj(options?: {
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
    include.push(['tags_json', 'tags']);

    attributes.include = include;
    return attributes;
  }

  public async getListWithGroupsByIds(postIds: string[], must: boolean): Promise<IPost[]> {
    const postGroups = await this.postModel.findAll({
      attributes: ['id', 'title', 'lang', 'status', 'createdBy'],
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
      ],
      where: {
        id: postIds,
      },
    });

    return postGroups;
  }

  public getIncludeObj({
    mustIncludeGroup = false,
    mustIncludeMedia,
    mustInSeriesIds,
    shouldIncludeCategory,
    shouldIncludeOwnerReaction,
    shouldIncludeGroup,
    shouldIncludeMention,
    shouldIncludeMedia,
    shouldIncludePreviewLink,
    shouldIncludeCover,
    shouldIncludeArticlesInSeries,
    shouldIncludeSeries,
    filterMediaIds,
    filterCategoryIds,
    authUserId,
    filterGroupIds,
  }: {
    mustIncludeGroup?: boolean;
    mustIncludeMedia?: boolean;
    mustInSeriesIds?: string[];
    shouldIncludeCategory?: boolean;
    shouldIncludeOwnerReaction?: boolean;
    shouldIncludeGroup?: boolean;
    shouldIncludeMention?: boolean;
    shouldIncludeMedia?: boolean;
    shouldIncludePreviewLink?: boolean;
    shouldIncludeCover?: boolean;
    shouldIncludeArticlesInSeries?: boolean;
    shouldIncludeSeries?: boolean;
    filterMediaIds?: string[];
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
        attributes: ['groupId', 'isArchived'],
        where: { isArchived: false },
      };
      if (filterGroupIds) {
        obj['where']['groupId'] = filterGroupIds;
      }
      includes.push(obj);
    }

    if (shouldIncludeMention) {
      includes.push({
        model: MentionModel,
        as: 'mentions',
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
          'createdBy',
          'canShare',
          'canComment',
          'canReact',
          'importantExpiredAt',
          'type',
        ],
        where: {
          status: PostStatus.PUBLISHED,
          isHidden: false,
        },
        include: [
          {
            model: MediaModel,
            as: 'coverMedia',
            required: false,
          },
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
    if (shouldIncludeMedia || mustIncludeMedia) {
      const obj = {
        model: MediaModel,
        as: 'media',
        required: mustIncludeMedia ? true : false,
        attributes: [
          'id',
          'url',
          'size',
          'extension',
          'type',
          'name',
          'originName',
          'width',
          'height',
          'thumbnails',
          'status',
          'mimeType',
          'createdAt',
        ],
      };
      if (filterMediaIds) {
        obj['where'] = { id: filterMediaIds };
      }
      includes.push(obj);
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

    if (shouldIncludePreviewLink) {
      includes.push({
        model: LinkPreviewModel,
        as: 'linkPreview',
        required: false,
      });
    }

    if (shouldIncludeCover) {
      const obj = {
        model: MediaModel,
        as: 'coverMedia',
        required: false,
      };

      includes.push(obj);
    }

    if (shouldIncludeSeries) {
      includes.push({
        model: PostModel,
        as: 'series',
        required: false,
        through: {
          attributes: [],
        },
        attributes: ['id', 'title'],
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

  /**
   * Create Post
   * @param authUser UserDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async create(authUser: UserDto, createPostDto: CreatePostDto): Promise<IPost> {
    let transaction;
    try {
      const { content, media, setting, mentions, audience, tags, series } = createPostDto;
      const authUserId = authUser.id;

      const { files, images, videos } = media;
      const uniqueMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
      let tagList = [];
      if (tags) {
        tagList = await this.tagService.getTagsByIds(tags);
      }
      transaction = await this.sequelizeConnection.transaction();
      const post = await this.postModel.create(
        {
          status: PostStatus.DRAFT,
          type: PostType.POST,
          content,
          createdBy: authUserId,
          updatedBy: authUserId,
          isImportant: setting.isImportant,
          importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
          canShare: setting.canShare,
          canComment: setting.canComment,
          canReact: setting.canReact,
          tagsJson: tagList,
        },
        { transaction }
      );

      if (uniqueMediaIds.length) {
        await this.mediaService.createIfNotExist(media, authUserId);
        await this.mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      if (audience.groupIds.length > 0) {
        await this.addGroup(audience.groupIds, post.id, transaction);
      }

      if (mentions.length) {
        await this.mentionService.create(
          mentions.map((userId) => ({
            entityId: post.id,
            userId,
            mentionableType: MentionableType.POST,
          })),
          transaction
        );
      }

      if (tags) {
        await this.tagService.addToPost(tags, post.id, transaction);
      }

      if (series) {
        await this._addSeriesToPost(series, post.id, transaction);
      }

      await transaction.commit();

      return post;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this.logger.error(error, error?.stack);
      this.sentryService.captureException(error);
      throw error;
    }
  }

  public async getPrivacy(groupIds: string[]): Promise<PostPrivacy> {
    if (groupIds.length === 0) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_GROUP_REQUIRED);
    }
    const groups = await this.groupService.getMany(groupIds);
    let totalPrivate = 0;
    let totalOpen = 0;
    for (const group of groups) {
      if (group.privacy === GroupPrivacy.OPEN) {
        return PostPrivacy.OPEN;
      }
      if (group.privacy === GroupPrivacy.CLOSED) totalOpen++;
      if (group.privacy === GroupPrivacy.PRIVATE) totalPrivate++;
    }

    if (totalOpen > 0) return PostPrivacy.CLOSED;
    if (totalPrivate > 0) return PostPrivacy.PRIVATE;
    return PostPrivacy.SECRET;
  }

  /**
   * Update Post
   */
  public async update(
    post: PostResponseDto,
    authUser: UserDto,
    updatePostDto: UpdatePostDto
  ): Promise<boolean> {
    const authUserId = authUser.id;
    let transaction;
    try {
      const { media, mentions, audience, setting, tags, series } = updatePostDto;

      let mediaListChanged = [];
      if (media) {
        mediaListChanged = await this.mediaService.createIfNotExist(media, authUserId);
      }

      const dataUpdate = await this.getDataUpdate(updatePostDto, authUserId);

      if (
        mediaListChanged &&
        mediaListChanged.filter(
          (m) =>
            m.status === MediaStatus.WAITING_PROCESS ||
            m.status === MediaStatus.PROCESSING ||
            m.status === MediaStatus.FAILED
        ).length > 0 &&
        post.status === PostStatus.PUBLISHED
      ) {
        dataUpdate['status'] = PostStatus.PROCESSING;
      }

      dataUpdate.linkPreviewId = null;
      if (updatePostDto.linkPreview) {
        const linkPreview = await this.linkPreviewService.upsert(updatePostDto.linkPreview);
        dataUpdate.linkPreviewId = linkPreview?.id || null;
      }

      if (series) {
        const filterSeriesExist = await this.postModel.findAll({
          where: {
            id: series,
          },
        });
        await this._updateSeriesToPost(
          filterSeriesExist.map((series) => series.id),
          post.id,
          transaction
        );
      }

      if (tags) {
        const tagList = await this.tagService.getTagsByIds(tags);
        await this.tagService.updateToPost(tags, post.id, transaction);
        dataUpdate['tagsJson'] = tagList;
      }

      transaction = await this.sequelizeConnection.transaction();
      await this.postModel.update(dataUpdate, {
        where: {
          id: post.id,
          createdBy: authUserId,
        },
        transaction,
      });

      if (media) {
        const { files, images, videos } = media;
        const newMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
        await this.mediaService.sync(post.id, EntityType.POST, newMediaIds, transaction);
      }

      if (mentions) {
        await this.mentionService.setMention(mentions, MentionableType.POST, post.id, transaction);
      }

      const oldGroupIds = post.audience.groups.map((group) => group.id);
      if (audience.groupIds && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
        await this.setGroupByPost(audience.groupIds, post.id, transaction);
      }

      if (setting && setting.isImportant) {
        const checkMarkImportant = await this.userMarkReadPostModel.findOne({
          where: {
            postId: post.id,
            userId: authUserId,
          },
        });
        if (!checkMarkImportant) {
          await this.userMarkReadPostModel.bulkCreate(
            [
              {
                postId: post.id,
                userId: authUserId,
              },
            ],
            { ignoreDuplicates: true, transaction }
          );
        }
      }

      await transaction.commit();

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this.logger.error(error, error?.stack);
      throw error;
    }
  }

  protected async getDataUpdate(
    updatePostDto: UpdatePostDto,
    authUserId: string
  ): Promise<Partial<IPost>> {
    const { content, setting, audience } = updatePostDto;
    const dataUpdate = {
      updatedBy: authUserId,
    };
    if (audience.groupIds.length) {
      const postPrivacy = await this.getPrivacy(audience.groupIds);
      dataUpdate['privacy'] = postPrivacy;
    }

    if (content !== null) {
      dataUpdate['content'] = content;
    }
    if (setting && setting.hasOwnProperty('canShare')) {
      dataUpdate['canShare'] = setting.canShare;
    }
    if (setting && setting.hasOwnProperty('canComment')) {
      dataUpdate['canComment'] = setting.canComment;
    }
    if (setting && setting.hasOwnProperty('canReact')) {
      dataUpdate['canReact'] = setting.canReact;
    }

    if (setting && setting.hasOwnProperty('isImportant')) {
      dataUpdate['isImportant'] = setting.isImportant;
    }
    if (setting && setting.hasOwnProperty('importantExpiredAt') && setting.isImportant === true) {
      dataUpdate['importantExpiredAt'] = setting.importantExpiredAt;
    }

    return dataUpdate;
  }

  /**
   * Publish Post
   */
  public async publish(post: PostResponseDto, authUser: UserDto): Promise<PostResponseDto> {
    try {
      const authUserId = authUser.id;
      const groupIds = post.audience.groups.map((g) => g.id);

      let status = PostStatus.PUBLISHED;
      if (
        post.media.videos.filter(
          (m) =>
            m.status === MediaStatus.WAITING_PROCESS ||
            m.status === MediaStatus.PROCESSING ||
            m.status === MediaStatus.FAILED
        ).length > 0
      ) {
        status = PostStatus.PROCESSING;
      }
      const postPrivacy = await this.getPrivacy(groupIds);
      await this.postModel.update(
        {
          status,
          privacy: postPrivacy,
          createdAt: new Date(),
        },
        {
          where: {
            id: post.id,
            createdBy: authUserId,
          },
        }
      );
      post.status = status;
      if (post.setting.isImportant) {
        const checkMarkImportant = await this.userMarkReadPostModel.findOne({
          where: {
            postId: post.id,
            userId: authUserId,
          },
        });
        if (!checkMarkImportant) {
          await this.userMarkReadPostModel.create({
            postId: post.id,
            userId: authUserId,
          });
        }
        post.markedReadPost = true;
      }
      return post;
    } catch (error) {
      this.logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Delete post
   */
  public async delete(post: IPost, authUser: UserDto): Promise<IPost> {
    const transaction = await this.sequelizeConnection.transaction();
    try {
      const postId = post.id;
      if (post.status === PostStatus.DRAFT) {
        await this.cleanRelationship(postId, transaction, true);
        await this.postModel.destroy({
          where: {
            id: postId,
            createdBy: authUser.id,
          },
          transaction: transaction,
          force: true,
        });
      } else {
        await this.postModel.destroy({
          where: {
            id: postId,
            createdBy: authUser.id,
          },
          transaction: transaction,
        });
      }
      await transaction.commit();

      return post;
    } catch (error) {
      this.logger.error(error, error?.stack);
      await transaction.rollback();
      throw error;
    }
  }

  public async cleanRelationship(
    postId: string,
    transaction: Transaction,
    isCleanMedia = false
  ): Promise<void> {
    await Promise.all([
      this.mentionService.setMention([], MentionableType.POST, postId, transaction),
      isCleanMedia
        ? this.mediaService.sync(postId, EntityType.POST, [], transaction)
        : Promise.resolve(),
      this.setGroupByPost([], postId, transaction),
      this.reactionService.deleteByPostIds([postId]),
      this.commentService.deleteCommentsByPost(postId, transaction),
      this.feedService.deleteNewsFeedByPost(postId, transaction),
      this.feedService.deleteUserSeenByPost(postId, transaction),
      this.postCategoryModel.destroy({ where: { postId: postId }, transaction }),
      this.postSeriesModel.destroy({ where: { postId: postId }, transaction }),
      this.postHashtagModel.destroy({ where: { postId: postId }, transaction }),
      this.postTagModel.destroy({ where: { postId: postId }, transaction }),
      this.userMarkReadPostModel.destroy({ where: { postId }, transaction }),
    ]);
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
    if (groupIds.length === 0) return;
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
          {
            model: MentionModel,
            as: 'mentions',
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
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
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

  public async findIdsByGroupId(groupIds: string[], take = 1000): Promise<string[]> {
    if (groupIds.length === 0) return [];
    try {
      const posts = await this.postModel.findAll({
        attributes: ['id'],
        subQuery: false,
        where: {
          status: PostStatus.PUBLISHED,
          isHidden: false,
        },
        include: [
          {
            model: PostGroupModel,
            as: 'groups',
            required: true,
            attributes: ['groupId'],
            where: {
              groupId: groupIds,
              isArchived: false,
            },
          },
        ],
        limit: take,
        order: [['createdAt', 'DESC']],
      });
      return posts.map((p) => p.id);
    } catch (ex) {
      this.logger.error(ex, ex?.stack);
      this.sentryService.captureException(ex);
      return [];
    }
  }

  public async markRead(postId: string, userId: string): Promise<void> {
    const post = await this.postModel.findByPk(postId);
    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
    if (post && post.createdBy === userId) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_AS_READ_NOT_ALLOW);
    }
    const readPost = await this.userMarkReadPostModel.findOne({
      where: {
        postId,
        userId,
      },
    });
    if (!readPost) {
      await this.userMarkReadPostModel.create({
        postId,
        userId,
      });
    }
  }

  public async getListSavedByUserId(
    userId: string,
    search: {
      offset: number;
      limit: number;
      isImportant?: boolean;
      type?: PostType;
      groupIds?: string[];
    }
  ): Promise<string[]> {
    if (!userId) return [];
    const { groupIds, type, isImportant, offset, limit } = search;
    const condition = {
      status: PostStatus.PUBLISHED,
      isHidden: false,
    };

    if (type) {
      condition['type'] = type;
    }

    if (isImportant) {
      condition['isImportant'] = true;
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
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_EXISTING);
    }
  }

  public async getsByMedia(id: string): Promise<PostResponseDto[]> {
    const include = this.getIncludeObj({
      mustIncludeMedia: true,
      shouldIncludeGroup: true,
      shouldIncludeMention: true,
      filterMediaIds: [id],
    });
    const posts = await this.postModel.findAll({ include });

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

  public async updateStatus(postId: string): Promise<void> {
    const mediaList = await this.mediaService.getMediaByPostId(postId);
    let totalWaitingProcess = 0;
    let totalProcessing = 0;
    let totalFailed = 0;
    let totalCompleted = 0;
    for (const media of mediaList) {
      if (media.status === MediaStatus.COMPLETED) totalCompleted++;
      if (media.status === MediaStatus.FAILED) totalFailed++;
      if (media.status === MediaStatus.WAITING_PROCESS) totalWaitingProcess++;
      if (media.status === MediaStatus.PROCESSING) totalProcessing++;
    }
    let status;
    if (totalCompleted === mediaList.length) status = PostStatus.PUBLISHED;
    if (totalProcessing > 0) status = PostStatus.PROCESSING;
    if (totalFailed === mediaList.length || totalWaitingProcess === mediaList.length)
      status = PostStatus.DRAFT;
    await this.postModel.update({ status }, { where: { id: postId } });
  }

  public checkContent(content: string, media: MediaDto): void {
    if (
      !content &&
      media?.files.length === 0 &&
      media?.videos.length === 0 &&
      media?.images.length === 0
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY);
    }
  }

  public async updatePrivacy(postId: string): Promise<void> {
    const post = await this.findPost({ postId });
    if (post.groups.length === 0) return;
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

  public getPostPrivacyByCompareGroupPrivacy(
    groupPrivacy: GroupPrivacy,
    postPrivacy: PostPrivacy
  ): PostPrivacy {
    if (groupPrivacy === GroupPrivacy.OPEN || postPrivacy === PostPrivacy.OPEN) {
      return PostPrivacy.OPEN;
    }
    if (groupPrivacy === GroupPrivacy.CLOSED || postPrivacy === PostPrivacy.CLOSED) {
      return PostPrivacy.CLOSED;
    }
    if (groupPrivacy === GroupPrivacy.PRIVATE || postPrivacy === PostPrivacy.PRIVATE) {
      return PostPrivacy.PRIVATE;
    }
    return PostPrivacy.SECRET;
  }

  public async filterPostIdsNeedToUpdatePrivacy(
    postIds: string[],
    newPrivacy: PostPrivacy
  ): Promise<{ [key: string]: string[] }> {
    const relationInfo = await this.postGroupModel.findAll({
      where: { postId: { [Op.in]: postIds } },
    });
    const groupIds = [...new Set(relationInfo.map((e) => e.groupId))];
    const groupInfos = await this.groupService.getMany(groupIds);
    const groupPrivacyMapping = groupInfos.reduce((returnValue, elementValue) => {
      returnValue[elementValue.id] = elementValue.privacy;
      return returnValue;
    }, {});
    const postPrivacyMapping = relationInfo.reduce((returnValue, elementValue) => {
      if (!returnValue[elementValue.postId]) {
        returnValue[elementValue.postId] = this.getPostPrivacyByCompareGroupPrivacy(
          groupPrivacyMapping[elementValue.groupId],
          newPrivacy
        );
      } else {
        returnValue[elementValue.postId] = this.getPostPrivacyByCompareGroupPrivacy(
          groupPrivacyMapping[elementValue.groupId],
          returnValue[elementValue.postId]
        );
      }
      return returnValue;
    }, {});
    const updatedPostIds = {};
    Object.entries(postPrivacyMapping).forEach(([postId, postPrivacy]) => {
      if (!updatedPostIds[postPrivacy.toString()]) {
        updatedPostIds[postPrivacy.toString()] = [postId];
      } else {
        updatedPostIds[postPrivacy.toString()].push(postId);
      }
    });
    return updatedPostIds;
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

  public async getPostIdsInNewsFeed(
    userId: string,
    filters: {
      offset: number;
      limit: number;
      isImportant?: boolean;
      type?: PostType;
    }
  ): Promise<string[]> {
    const { offset, limit, isImportant, type } = filters;
    const conditions = {
      status: PostStatus.PUBLISHED,
      isHidden: false,
      [Op.and]: [
        this.postModel.notIncludePostsReported(userId, {
          mainTableAlias: '"PostModel"',
          type: [TargetType.ARTICLE, TargetType.POST],
        }),
      ],
    };
    const order = [];
    if (isImportant) {
      conditions['isImportant'] = true;
      order.push([this.sequelizeConnection.literal('"markedReadPost" ASC')]);
    }
    order.push(['createdAt', 'desc']);

    if (type) {
      conditions['type'] = type;
    }

    const posts = await this.postModel.findAll({
      attributes: ['id', PostModel.loadMarkReadPost(userId)],
      include: [
        {
          model: UserNewsFeedModel,
          as: 'userNewsfeeds',
          required: true,
          attributes: [],
          where: {
            userId,
          },
        },
        {
          model: PostGroupModel,
          as: 'groups',
          required: true,
          attributes: [],
          where: {
            isArchived: false,
          },
        },
      ],
      subQuery: false,
      where: conditions,
      order,
      group: '"PostModel"."id"',
      offset,
      limit,
    });

    return posts.map((post) => post.id);
  }

  public async getPostsByIds(
    ids: string[],
    userId: string | null,
    isPostOnly = false
  ): Promise<IPost[]> {
    if (ids.length === 0) return [];

    const include = this.getIncludeObj({
      shouldIncludeCategory: true,
      shouldIncludeGroup: true,
      shouldIncludeMedia: true,
      shouldIncludeMention: true,
      shouldIncludeOwnerReaction: true,
      shouldIncludePreviewLink: true,
      shouldIncludeCover: true,
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
          PostModel.loadMarkReadPost(userId),
          PostModel.loadSaved(userId),
        ],
      },
      include,
      where: conditions,
    });

    const articleIdsReported = await this.getEntityIdsReportedByUser(userId, [
      TargetType.ARTICLE,
      TargetType.POST,
    ]);

    const mappedPosts = [];
    for (const postId of ids) {
      const post = rows.find((row) => row.id === postId);
      if (post) {
        const postJson = post.toJSON();
        postJson.items = postJson.items.filter((item) => !articleIdsReported.includes(item.id));
        mappedPosts.push(postJson);
      }
    }
    return mappedPosts;
  }

  public async getSimplePostsByIds(ids: string[]): Promise<IPost[]> {
    if (ids.length === 0) return [];
    const rows = await this.postModel.findAll({
      attributes: [
        'id',
        'title',
        'summary',
        'createdBy',
        'canShare',
        'canComment',
        'canReact',
        'importantExpiredAt',
      ],
      include: [
        {
          model: MediaModel,
          as: 'coverMedia',
          required: false,
        },
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
      if (post) mappedPosts.push(post.toJSON());
    }

    return mappedPosts;
  }

  public async getPostIdsInGroupIds(
    groupIds: string[],
    filters: {
      offset: number;
      limit: number;
      authUserId: string;
      isImportant?: boolean;
      type?: PostType;
    }
  ): Promise<string[]> {
    const { offset, limit, authUserId, isImportant, type } = filters;
    const conditions = {
      status: PostStatus.PUBLISHED,
      isHidden: false,
    };

    if (authUserId) {
      conditions[Op.and] = [
        this.postModel.notIncludePostsReported(authUserId, {
          mainTableAlias: '"PostModel"',
          type: [TargetType.ARTICLE, TargetType.POST],
        }),
      ];
    }
    const order = [];
    const attributes: any = ['id'];
    if (isImportant) {
      conditions['isImportant'] = true;
      order.push([this.sequelizeConnection.literal('"markedReadPost" ASC')]);
      attributes.push(PostModel.loadMarkReadPost(authUserId));
    } else {
      order.push([this.sequelizeConnection.literal('"isImportant"'), 'desc']);
      attributes.push(PostModel.loadImportant(authUserId));
    }
    order.push(['createdAt', 'desc']);

    if (type) {
      conditions['type'] = type;
    }

    const posts = await this.postModel.findAll({
      attributes,
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: true,
          attributes: [],
          where: {
            groupId: groupIds,
            isArchived: false,
          },
        },
      ],
      subQuery: false,
      where: conditions,
      order,
      group: 'id',
      offset,
      limit,
    });

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
      if (findGroup)
        return {
          groupId,
          totalPost: findGroup.totalPost || 0,
          totalArticle: findGroup.totalArticle || 0,
          totalSeries: findGroup.totalSeries || 0,
        };
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
    targetTypes: TargetType[],
    options?: {
      reportTo?: ReportTo;
      groupIds?: string[];
    }
  ): Promise<string[]> {
    if (!userId) return [];
    const { groupIds } = options ?? {};
    const condition = {
      [Op.and]: [
        {
          createdBy: userId,
          targetType: targetTypes,
        },
      ],
    };

    if (groupIds) {
      //condition[''] improve later
    }
    const rows = await this.reportContentDetailModel.findAll({
      where: condition,
    });

    return rows.map((row) => row.targetId);
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

  public async updateGroupStateAndGetPostIdsAffected(
    groupIds: string[],
    isArchive: boolean
  ): Promise<string[]> {
    const notInStateGroupIds = await this.postGroupModel.findAll({
      attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('group_id')), 'groupId'], 'is_archived'],
      where: { groupId: groupIds, isArchived: !isArchive },
      limit: groupIds.length,
    });

    const [affectedCount] = await this.postGroupModel.update(
      { isArchived: isArchive },
      { where: { groupId: notInStateGroupIds.map((e) => e.groupId) } }
    );
    if (affectedCount > 0) {
      const affectPostGroups = await ModelHelper.getAllRecursive<IPostGroup>(this.postGroupModel, {
        groupId: notInStateGroupIds.map((e) => e.groupId),
      });
      return affectPostGroups.map((e) => e.postId);
    }
    return null;
  }

  public async getPostsArchivedOrRestoredByGroupEventPayload(
    postIds: string[]
  ): Promise<PostsArchivedOrRestoredByGroupEventPayload> {
    const postGroups = await ModelHelper.getAllRecursive<IPostGroup>(this.postGroupModel, {
      postId: postIds,
      isArchived: false,
    });
    const postIndex: { [key: string]: string[] } = postIds.reduce((result, postId) => {
      if (!result[postId]) {
        result[postId] = postGroups.filter((e) => e.postId === postId).map((e) => e.groupId);
      }
      return result;
    }, {});
    const affectedPosts = await ModelHelper.getAllRecursive<IPost>(this.postModel, {
      id: Object.keys(postIndex),
    });
    return {
      posts: affectedPosts,
      mappingPostIdGroupIds: postIndex,
    };
  }

  private async _addSeriesToPost(
    seriesIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    if (seriesIds.length === 0) return;
    const dataCreate = seriesIds.map((seriesId) => ({
      postId: postId,
      seriesId,
    }));
    await this.postSeriesModel.bulkCreate(dataCreate, { transaction });
  }

  private async _updateSeriesToPost(
    seriesIds: string[],
    postId: string,
    transaction: Transaction
  ): Promise<void> {
    const currentSeries = await this.postSeriesModel.findAll({
      where: { postId },
    });
    const currentSeriesIds = currentSeries.map((i) => i.seriesId);

    const deleteSeriesIds = ArrayHelper.arrDifferenceElements(currentSeriesIds, seriesIds);
    if (deleteSeriesIds.length) {
      await this.postSeriesModel.destroy({
        where: { seriesId: deleteSeriesIds, postId },
        transaction,
      });
    }

    const addSeriesIds = ArrayHelper.arrDifferenceElements(seriesIds, currentSeriesIds);
    if (addSeriesIds.length) {
      const dataInsert = [];
      for (const seriesId of addSeriesIds) {
        const maxIndexArticlesInSeries: number = await this.postSeriesModel.max('zindex', {
          where: {
            seriesId,
          },
        });
        dataInsert.push({
          postId,
          seriesId,
          zindex: maxIndexArticlesInSeries + 1,
        });
      }

      await this.postSeriesModel.bulkCreate(dataInsert, { transaction });
    }
  }
}
