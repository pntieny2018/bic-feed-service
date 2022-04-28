import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { ClassTransformer, plainToInstance } from 'class-transformer';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { HTTP_STATUS_ID, MentionableType } from '../../common/constants';
import { EntityIdDto, OrderEnum } from '../../common/dto';
import { LogicException } from '../../common/exceptions';
import { ArrayHelper, ElasticsearchHelper, ExceptionHelper } from '../../common/helpers';
import { getDatabaseConfig } from '../../config/database';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { CommentModel } from '../../database/models/comment.model';
import { MediaModel } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { PostEditedHistoryMediaModel } from '../../database/models/post-edited-history-media.model';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { IPost, PostModel } from '../../database/models/post.model';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { GroupService } from '../../shared/group';
import { UserService } from '../../shared/user';
import { UserDto } from '../auth';
import { AuthorityService } from '../authority';
import { CommentService } from '../comment';
import { FeedService } from '../feed/feed.service';
import { MediaService } from '../media';
import { EntityType } from '../media/media.constants';
import { MentionService } from '../mention';
import { CommonReactionService, DeleteReactionService } from '../reaction/services';
import { PageDto } from './../../common/dto/pagination/page.dto';
import {
  CreatePostDto,
  GetPostDto,
  GetPostEditedHistoryDto,
  SearchPostsDto,
  UpdatePostDto,
} from './dto/requests';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostEditedHistoryDto, PostResponseDto } from './dto/responses';

@Injectable()
export class PostService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(PostService.name);
  private _classTransformer = new ClassTransformer();
  public constructor(
    @InjectConnection()
    private _sequelizeConnection: Sequelize,
    @InjectModel(PostModel)
    private _postModel: typeof PostModel,
    @InjectModel(PostGroupModel)
    private _postGroupModel: typeof PostGroupModel,
    @InjectModel(UserMarkReadPostModel)
    private _userMarkReadPostModel: typeof UserMarkReadPostModel,
    private _userService: UserService,
    private _groupService: GroupService,
    private _mediaService: MediaService,
    private _mentionService: MentionService,
    @Inject(forwardRef(() => CommentService))
    private _commentService: CommentService,
    private _authorityService: AuthorityService,
    private _searchService: ElasticsearchService,
    private _deleteReactionService: DeleteReactionService,
    private _commonReactionService: CommonReactionService,
    @Inject(forwardRef(() => FeedService))
    private _feedService: FeedService,
    @InjectModel(PostEditedHistoryModel)
    private readonly _postEditedHistoryModel: typeof PostEditedHistoryModel,
    @InjectModel(PostEditedHistoryMediaModel)
    private readonly _postEditedHistoryMediaModel: typeof PostEditedHistoryMediaModel
  ) {}

  /**
   * Get Draft Posts
   * @throws HttpException
   * @param authUser UserDto
   * @param searchPostsDto SearchPostsDto
   * @returns Promise resolve PageDto<PostResponseDto>
   */
  public async searchPosts(
    authUser: UserDto,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<PostResponseDto>> {
    const { content, limit, offset } = searchPostsDto;
    const user = authUser.profile;
    if (!user || user.groups.length === 0) {
      return new PageDto<PostResponseDto>([], {
        total: 0,
        limit,
        offset,
      });
    }
    const groupIds = user.groups;
    const payload = await this.getPayloadSearch(searchPostsDto, groupIds);
    const response = await this._searchService.search(payload);
    const hits = response.body.hits.hits;
    const posts = hits.map((item) => {
      const source = item._source;
      source['id'] = item._id;
      if (content && item.highlight && item.highlight['content'].length != 0 && source.content) {
        source.highlight = item.highlight['content'][0];
      }
      return source;
    });

    await Promise.all([
      //this.bindActorToPost(posts),
      this.bindAudienceToPost(posts),
      this.bindCommentsCount(posts),
    ]);

    const result = this._classTransformer.plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total: response.body.hits.total.value,
      limit,
      offset,
    });
  }
  /**
   *
   * @param SearchPostsDto
   * @param groupIds
   * @returns
   */
  public async getPayloadSearch(
    { startTime, endTime, content, actors, important, limit, offset }: SearchPostsDto,
    groupIds: number[]
  ): Promise<{
    index: string;
    body: any;
    from: number;
    size: number;
  }> {
    // search post
    const body = {
      query: {
        bool: {
          must: [],
          filter: [],
          should: [],
        },
      },
    };

    if (actors && actors.length) {
      body.query.bool.filter.push({
        terms: {
          ['actor.id']: actors,
        },
      });
    }

    if (groupIds.length) {
      body.query.bool.filter.push({
        terms: {
          ['audience.groups.id']: groupIds,
        },
      });
    }

    if (important) {
      body.query.bool.must.push({
        term: {
          ['setting.isImportant']: true,
        },
      });
      body.query.bool.must.push({
        range: {
          ['setting.importantExpiredAt']: { gt: new Date().toISOString() },
        },
      });
    }

    if (content) {
      body.query.bool.should.push({
        ['dis_max']: {
          queries: [
            {
              match: { content },
            },
            {
              match: {
                ['content.ascii']: {
                  query: content,
                  boost: 0.6,
                },
              },
            },
            {
              match: {
                ['content.ngram']: {
                  query: content,
                  boost: 0.3,
                },
              },
            },
          ],
        },
      });
      body.query.bool['minimum_should_match'] = 1;
      body['highlight'] = {
        ['pre_tags']: ['=='],
        ['post_tags']: ['=='],
        fields: {
          content: {
            ['matched_fields']: ['content', 'content.ascii', 'content.ngram'],
            type: 'fvh',
            ['number_of_fragments']: 0,
          },
        },
      };

      body['sort'] = [{ ['_score']: 'desc' }, { createdAt: 'desc' }];
    } else {
      body['sort'] = [{ createdAt: 'desc' }];
    }

    if (startTime || endTime) {
      const filterTime = {
        range: {
          createdAt: {},
        },
      };

      if (startTime) filterTime.range.createdAt['gte'] = startTime;
      if (endTime) filterTime.range.createdAt['lte'] = endTime;
      body.query.bool.must.push(filterTime);
    }
    return {
      index: ElasticsearchHelper.INDEX.POST,
      body,
      from: offset,
      size: limit,
    };
  }
  /**
   * Get Draft Posts
   * @param authUserId auth user ID
   * @param getDraftPostDto GetDraftPostDto
   * @returns Promise resolve PageDto<PostResponseDto>
   * @throws HttpException
   */
  public async getDraftPosts(
    authUserId: number,
    getDraftPostDto: GetDraftPostDto
  ): Promise<PageDto<PostResponseDto>> {
    const { limit, offset, order } = getDraftPostDto;
    const { rows, count } = await this._postModel.findAndCountAll<PostModel>({
      where: {
        createdBy: authUserId,
        isDraft: true,
      },
      attributes: {
        exclude: ['commentsCount'],
      },
      include: [
        {
          model: PostGroupModel,
          attributes: ['groupId'],
          required: false,
        },
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          attributes: ['id', 'url', 'type', 'name', 'width', 'height'],
          required: false,
        },
        {
          model: MentionModel,
          required: false,
        },
      ],
      offset: offset,
      limit: limit,
      order: [['createdAt', order]],
    });
    const jsonPosts = rows.map((r) => r.toJSON());
    await Promise.all([
      this._mentionService.bindMentionsToPosts(jsonPosts),
      this.bindActorToPost(jsonPosts),
      this.bindAudienceToPost(jsonPosts),
    ]);
    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });

    return new PageDto<PostResponseDto>(result, {
      total: count,
      limit,
      offset,
    });
  }

  /**
   * Get Post
   * @param postId number
   * @param user UserDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async getPost(
    postId: number,
    user: UserDto,
    getPostDto?: GetPostDto
  ): Promise<PostResponseDto> {
    const post = await this._postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
      },
      where: { id: postId },
      include: [
        {
          model: PostGroupModel,
          as: 'groups',
          required: false,
          attributes: ['groupId'],
        },
        {
          model: MentionModel,
          as: 'mentions',
          required: false,
          attributes: ['userId'],
        },
        {
          model: MediaModel,
          as: 'media',
          required: false,
          attributes: ['id', 'url', 'type', 'name', 'width', 'height'],
        },
        {
          model: PostReactionModel,
          as: 'ownerReactions',
          required: false,
          where: {
            createdBy: user.id,
          },
        },
      ],
    });

    if (!post) {
      //throw new NotFoundException('Post not found');
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    await this._authorityService.allowAccess(user, post);
    const comments = await this._commentService.getComments(
      user,
      {
        postId,
        childLimit: getPostDto.childCommentLimit,
        order: OrderEnum.DESC,
        limit: getPostDto.commentLimit,
      },
      false
    );
    const jsonPost = post.toJSON();
    await Promise.all([
      this._commonReactionService.bindReactionToPosts([jsonPost]),
      this._mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    return this._classTransformer.plainToInstance(
      PostResponseDto,
      { ...jsonPost, comments },
      {
        excludeExtraneousValues: true,
      }
    );
  }

  /**
   * Bind Audience To Post.Groups
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */

  public async bindAudienceToPost(posts: any[]): Promise<void> {
    const groupIds = [];
    for (const post of posts) {
      let postGroups = post.groups;
      if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch

      if (postGroups && postGroups.length) {
        groupIds.push(...postGroups.map((m) => m.groupId || m.id));
      }
    }
    const dataGroups = await this._groupService.getMany(groupIds);
    for (const post of posts) {
      let groups = [];
      let postGroups = post.groups;
      if (post.audience?.groups) postGroups = post.audience?.groups; //bind for elasticsearch
      if (postGroups && postGroups.length) {
        const mappedGroups = [];
        postGroups.forEach((group) => {
          const dataGroup = dataGroups.find((i) => i.id === group.id || i.id === group.groupId);
          if (dataGroup) mappedGroups.push(dataGroup);
        });
        groups = mappedGroups;
      }
      post.audience = { groups };
    }
  }

  /**
   * Bind Actor info to post.createdBy
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindActorToPost(posts: any[]): Promise<void> {
    const userIds = [];
    for (const post of posts) {
      userIds.push(post.createdBy);
    }
    const users = await this._userService.getMany(userIds);
    for (const post of posts) {
      post.actor = users.find((i) => i.id === post.createdBy);
    }
  }
  /**
   * Bind commentsCount info to post
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */
  public async bindCommentsCount(posts: any[]): Promise<void> {
    const postIds = [];
    for (const post of posts) {
      postIds.push(post.id);
    }
    const result = await this._postModel.findAll({
      raw: true,
      attributes: ['id', 'commentsCount'],
      where: { id: postIds },
    });
    for (const post of posts) {
      const findPost = result.find((i) => i.id == post.id);
      post.commentsCount = findPost?.commentsCount || 0;
    }
  }

  /**
   * Create Post
   * @param authUser UserDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async createPost(authUser: UserDto, createPostDto: CreatePostDto): Promise<IPost> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const { content, media, setting, mentions, audience } = createPostDto;
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_EXISTING);
      }
      const { groupIds } = audience;
      const isMember = this._groupService.isMemberOfGroups(groupIds, creator.groups);
      if (!isMember) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }
      if (mentions.length) {
        await this._mentionService.checkValidMentions(groupIds, mentions);
      }

      const { files, videos, images } = media;
      const uniqueMediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      await this._mediaService.checkValidMedia(uniqueMediaIds, authUserId);

      const post = await this._postModel.create(
        {
          isDraft: true,
          content,
          createdBy: authUserId,
          updatedBy: authUserId,
          isImportant: setting.isImportant,
          importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
          canShare: setting.canShare,
          canComment: setting.canComment,
          canReact: setting.canReact,
        },
        { transaction }
      );

      if (uniqueMediaIds.length) {
        await this._mediaService.sync(post.id, EntityType.POST, uniqueMediaIds, transaction);
      }

      await this.addPostGroup(groupIds, post.id, transaction);

      if (mentions.length) {
        await this._mentionService.create(
          mentions.map((userId) => ({
            entityId: post.id,
            userId,
            mentionableType: MentionableType.POST,
          })),
          transaction
        );
      }

      await transaction.commit();

      this._savePostEditedHistory(post.id, uniqueMediaIds).catch((e) =>
        this._logger.error(e, e?.stack)
      );

      return post;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Save post edited history
   * @param postId number
   * @param uniqueMediaIds number[]
   */
  private async _savePostEditedHistory(postId: number, uniqueMediaIds: number[]): Promise<void> {
    const post = await this._postModel.findOne({
      where: {
        id: postId,
      },
    });

    const transaction = await this._sequelizeConnection.transaction();

    try {
      const postEditedHistory = await this._postEditedHistoryModel.create(
        {
          postId: postId,
          content: post.content,
          editedAt: post.updatedAt ?? post.createdAt,
        },
        { transaction: transaction }
      );

      const rawPostEditedHistoryMedia = uniqueMediaIds.map((e: number) => ({
        postEditedHistoryId: postEditedHistory.id,
        mediaId: e,
      }));

      await this._postEditedHistoryMediaModel.bulkCreate(rawPostEditedHistoryMedia, {
        transaction: transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * Update Post except isDraft
   * @param postId postID
   * @param authUser UserDto
   * @param updatePostDto UpdatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updatePost(
    postId: number,
    authUser: UserDto,
    updatePostDto: UpdatePostDto
  ): Promise<boolean> {
    const authUserId = authUser.id;
    const creator = authUser.profile;
    if (!creator) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_EXISTING);
    }

    const transaction = await this._sequelizeConnection.transaction();
    try {
      const { content, media, setting, mentions, audience } = updatePostDto;

      const { groupIds } = audience;
      const isMember = this._groupService.isMemberOfGroups(groupIds, creator.groups);
      if (!isMember) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }

      const mentionUserIds = mentions;
      if (mentionUserIds.length) {
        await this._mentionService.checkValidMentions(groupIds, mentionUserIds);
      }

      const { files, videos, images } = media;
      const uniqueMediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      await this._mediaService.checkValidMedia(uniqueMediaIds, authUserId);

      await this._postModel.update(
        {
          content,
          updatedBy: authUserId,
          isImportant: setting.isImportant,
          importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
          canShare: setting.canShare,
          canComment: setting.canComment,
          canReact: setting.canReact,
        },
        {
          where: {
            id: postId,
            createdBy: authUserId,
          },
          transaction,
        }
      );
      await this._mediaService.sync(postId, EntityType.POST, uniqueMediaIds, transaction);
      await this._mentionService.setMention(
        mentionUserIds,
        MentionableType.POST,
        postId,
        transaction
      );
      await this.setGroupByPost(groupIds, postId, transaction);
      await transaction.commit();

      this._savePostEditedHistory(postId, uniqueMediaIds).catch((e) =>
        this._logger.error(e, e?.stack)
      );

      return true;
    } catch (error) {
      await transaction.rollback();
      this._logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Publish Post
   * @param postId PostID
   * @param authUserId UserID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async publishPost(postId: number, authUserId: number): Promise<boolean> {
    try {
      const post = await this._postModel.findByPk(postId);
      await this.checkPostExistAndOwner(post, authUserId);
      const countMedia = await this._mediaService.countMediaByPost(postId);

      if (post.content === null && countMedia === 0) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY);
      }

      await this._postModel.update(
        {
          isDraft: false,
        },
        {
          where: {
            id: postId,
            createdBy: authUserId,
          },
        }
      );
      return true;
    } catch (error) {
      this._logger.error(error, error?.stack);
      throw error;
    }
  }
  /**
   * Check post exist and owner
   * @param post PostResponseDto
   * @param authUserId Auth userID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async checkPostExistAndOwner(
    post: PostResponseDto | PostModel | IPost,
    authUserId: number
  ): Promise<boolean> {
    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_EXISTING);
    }

    if (post.createdBy !== authUserId) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
    return true;
  }

  /**
   * Delete post by id
   * @param postId postID
   * @param authUserId auth user ID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deletePost(postId: number, authUserId: number): Promise<IPost> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const post = await this._postModel.findOne({ where: { id: postId } });
      await this.checkPostExistAndOwner(post, authUserId);
      await Promise.all([
        this._mentionService.setMention([], MentionableType.POST, postId, transaction),
        this._mediaService.sync(postId, EntityType.POST, [], transaction),
        this.setGroupByPost([], postId, transaction),
        this._deleteReactionService.deleteReactionByPostIds([postId], transaction),
        this._commentService.deleteCommentsByPost(postId, transaction),
        this._feedService.deleteNewsFeedByPost(postId, transaction),
        this._userMarkReadPostModel.destroy({ where: { postId }, transaction }),
        this._deletePostEditedHistory(postId),
      ]);
      await this._postModel.destroy({
        where: {
          id: postId,
          createdBy: authUserId,
        },
        transaction: transaction,
      });
      await transaction.commit();

      return post;
    } catch (error) {
      this._logger.error(error, error?.stack);
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete post edited history
   * @param postId number
   */
  private async _deletePostEditedHistory(postId: number): Promise<void> {
    const postEditedHistoryRows = await this._postEditedHistoryModel.findAll({
      where: {
        postId: postId,
      },
    });

    const postEditedHistoryIds = postEditedHistoryRows.map((e): number => e.id);

    await this._postEditedHistoryMediaModel.destroy({
      where: {
        postEditedHistoryId: {
          [Op.in]: postEditedHistoryIds,
        },
      },
    });

    await this._postEditedHistoryModel.destroy({
      where: {
        postId: postId,
      },
    });
  }

  /**
   * Add group to post
   * @param groupIds Array of Group ID
   * @param postId PostID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addPostGroup(
    groupIds: number[],
    postId: number,
    transaction: Transaction
  ): Promise<boolean> {
    if (groupIds.length === 0) return true;
    const postGroupDataCreate = groupIds.map((groupId) => ({
      postId: postId,
      groupId,
    }));
    await this._postGroupModel.bulkCreate(postGroupDataCreate, { transaction });
    return true;
  }

  /**
   * Delete/Insert group by post
   * @param groupIds Array of Group ID
   * @param postId PostID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async setGroupByPost(
    groupIds: number[],
    postId: number,
    transaction: Transaction
  ): Promise<boolean> {
    const currentGroups = await this._postGroupModel.findAll({
      where: { postId },
    });
    const currentGroupIds = currentGroups.map((i) => i.groupId);

    const deleteGroupIds = ArrayHelper.differenceArrNumber(currentGroupIds, groupIds);
    if (deleteGroupIds.length) {
      await this._postGroupModel.destroy({
        where: { groupId: deleteGroupIds, postId },
        transaction,
      });
    }

    const addGroupIds = ArrayHelper.differenceArrNumber(groupIds, currentGroupIds);
    if (addGroupIds.length) {
      await this._postGroupModel.bulkCreate(
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
            attributes: ['groupId'],
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

    const post = await this._postModel.findOne(conditions);

    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_EXISTING);
    }
    return post.toJSON();
  }

  public async findPostIdsByGroupId(groupId: number, take = 1000): Promise<number[]> {
    try {
      const posts = await this._postGroupModel.findAll({
        where: {
          groupId: groupId,
        },
        limit: take,
        order: ['createdAt', 'DESC'],
      });
      return posts.map((p) => p.postId);
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      return [];
    }
  }

  public async markReadPost(postId: number, userId: number): Promise<void> {
    try {
      const readPost = await this._userMarkReadPostModel.findOne({
        where: {
          postId,
          userId,
        },
      });
      if (!readPost) {
        await this._userMarkReadPostModel.create({
          postId,
          userId,
        });
      }
      return;
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_AS_READ_INVALID_PARAMETER);
    }
  }

  public async getTotalImportantPostInGroups(
    userId: number,
    groupIds: number[],
    constraints: string
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND NOT EXISTS (
        SELECT 1
        FROM ${schema}.users_mark_read_posts as u
        WHERE u.user_id = :userId AND u.post_id = p.id
      )
    AND EXISTS(
        SELECT 1
        from ${schema}.posts_groups AS g
        WHERE g.post_id = p.id
        AND g.group_id IN(:groupIds)
      )
    ${constraints}`;
    const result: any = await this._sequelizeConnection.query(query, {
      replacements: {
        groupIds,
        userId,
      },
      type: QueryTypes.SELECT,
    });
    return result[0].total;
  }

  public async getTotalImportantPostInNewsFeed(
    userId: number,
    constraints: string
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND NOT EXISTS (
        SELECT 1
        FROM ${schema}.users_mark_read_posts as u
        WHERE u.user_id = :userId AND u.post_id = p.id
      )
    AND EXISTS(
        SELECT 1
        from ${schema}.user_newsfeed AS u
        WHERE u.post_id = p.id
        AND u.user_id = :userId
      )
    ${constraints}`;
    const result: any = await this._sequelizeConnection.query(query, {
      replacements: {
        userId,
      },
      type: QueryTypes.SELECT,
    });
    return result[0].total;
  }

  /**
   * Get post edited history
   * @param user UserDto
   * @param postId number
   * @param getPostEditedHistoryDto GetPostEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getPostEditedHistory(
    user: UserDto,
    postId: number,
    getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    try {
      const post = await this.findPost({ postId: postId });
      await this._authorityService.allowAccess(user, post);

      if (post.isDraft === true && user.id !== post.createdBy) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.API_FORBIDDEN);
      }

      const { idGT, idGTE, idLT, idLTE, endTime, offset, limit, order } = getPostEditedHistoryDto;
      const conditions = {};
      conditions['postId'] = postId;
      if (idGT) {
        conditions['id'] = {
          [Op.gt]: idGT,
        };
      }
      if (idGTE) {
        conditions['id'] = {
          [Op.gte]: idGTE,
          ...conditions['id'],
        };
      }
      if (idLT) {
        conditions['id'] = {
          [Op.lt]: idLT,
          ...conditions['id'],
        };
      }
      if (idLTE) {
        conditions['id'] = {
          [Op.lte]: idLTE,
          ...conditions,
        };
      }
      if (endTime) {
        conditions['editedAt'] = {
          [Op.lt]: endTime,
        };
      }

      const { rows, count } = await this._postEditedHistoryModel.findAndCountAll({
        where: {
          ...conditions,
        },
        include: [
          {
            model: MediaModel,
            required: false,
          },
        ],
        order: [['id', order]],
        offset: offset,
        limit: limit,
      });

      const result = rows.map((e) =>
        plainToInstance(PostEditedHistoryDto, e.toJSON(), { excludeExtraneousValues: true })
      );

      return new PageDto(result, {
        limit: limit,
        total: count,
      });
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }
}
