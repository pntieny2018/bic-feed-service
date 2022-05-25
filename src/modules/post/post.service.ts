import { PageDto } from '../../common/dto';
import {
  HTTP_STATUS_ID,
  KAFKA_PRODUCER,
  KAFKA_TOPIC,
  MentionableType,
} from '../../common/constants';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { IPost, PostModel } from '../../database/models/post.model';
import { CreatePostDto, GetPostDto, SearchPostsDto, UpdatePostDto } from './dto/requests';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { UserDto } from '../auth';
import { MediaService } from '../media';
import { MentionService } from '../mention';
import { CommentService } from '../comment';
import { AuthorityService } from '../authority';
import { UserService } from '../../shared/user';
import { Sequelize } from 'sequelize-typescript';
import { PostResponseDto } from './dto/responses';
import { GroupService } from '../../shared/group';
import { ClassTransformer } from 'class-transformer';
import { EntityType } from '../media/media.constants';
import { LogicException } from '../../common/exceptions';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FeedService } from '../feed/feed.service';
import { UserMarkReadPostModel } from '../../database/models/user-mark-read-post.model';
import { MediaModel, MediaStatus } from '../../database/models/media.model';
import { MentionModel } from '../../database/models/mention.model';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { PostGroupModel } from '../../database/models/post-group.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { EntityIdDto } from '../../common/dto';
import { CommentModel } from '../../database/models/comment.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { ArrayHelper, ElasticsearchHelper, ExceptionHelper } from '../../common/helpers';
import { ReactionService } from '../reaction';
import { plainToInstance } from 'class-transformer';
import { Op, QueryTypes, Transaction } from 'sequelize';
import { getDatabaseConfig } from '../../config/database';
import { PostEditedHistoryModel } from '../../database/models/post-edited-history.model';
import { GetPostEditedHistoryDto } from './dto/requests';
import { PostEditedHistoryDto } from './dto/responses';
import sequelize from 'sequelize';
import { ClientKafka } from '@nestjs/microservices';
import { ProcessVideoResponseDto } from './dto/responses/process-video-response.dto';
import { PostMediaModel } from '../../database/models/post-media.model';
import { SentryService } from '../../../libs/sentry/src';

@Injectable()
export class PostService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(PostService.name);

  /**
   *  ClassTransformer
   * @private
   */
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
    private _reactionService: ReactionService,
    @Inject(forwardRef(() => FeedService))
    private _feedService: FeedService,
    @InjectModel(PostEditedHistoryModel)
    private readonly _postEditedHistoryModel: typeof PostEditedHistoryModel,
    @Inject(KAFKA_PRODUCER)
    private readonly _client: ClientKafka,
    private readonly _sentryService: SentryService
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
      this.bindActorToPost(posts),
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
   * @param postId string
   * @param user UserDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async getPost(
    postId: string,
    user: UserDto,
    getPostDto?: GetPostDto
  ): Promise<PostResponseDto> {
    const post = await this._postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
        include: [PostModel.loadMarkReadPost(user.id)],
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
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'status', 'uploadId'],
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
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    await this._authorityService.checkCanReadPost(user, post);
    let comments = null;
    if (getPostDto.withComment) {
      comments = await this._commentService.getComments(
        {
          postId,
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
    await Promise.all([
      this._reactionService.bindReactionToPosts([jsonPost]),
      this._mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });
    result['comments'] = comments;
    return result;
  }

  /**
   * Get Public Post
   * @param postId string
   * @param user UserDto
   * @param getPostDto GetPostDto
   * @returns Promise resolve PostResponseDto
   * @throws HttpException
   */
  public async getPublicPost(postId: string, getPostDto?: GetPostDto): Promise<PostResponseDto> {
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
          attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'status', 'uploadId'],
        },
      ],
    });

    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    await this._authorityService.checkPublicPost(post);
    let comments = null;
    if (getPostDto.withComment) {
      comments = await this._commentService.getComments({
        postId,
        childLimit: getPostDto.childCommentLimit,
        order: getPostDto.commentOrder,
        childOrder: getPostDto.childCommentOrder,
        limit: getPostDto.commentLimit,
      });
    }
    const jsonPost = post.toJSON();
    await Promise.all([
      this._reactionService.bindReactionToPosts([jsonPost]),
      this._mentionService.bindMentionsToPosts([jsonPost]),
      this.bindActorToPost([jsonPost]),
      this.bindAudienceToPost([jsonPost]),
    ]);

    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPost, {
      excludeExtraneousValues: true,
    });

    result['comments'] = comments;
    return result;
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
          delete dataGroup.child;
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
      if (post.actor?.id) {
        userIds.push(post.actor.id);
      } else {
        userIds.push(post.createdBy);
      }
    }
    const users = await this._userService.getMany(userIds);
    for (const post of posts) {
      if (post.actor?.id) {
        post.actor = users.find((i) => i.id === post.actor.id);
      } else {
        post.actor = users.find((i) => i.id === post.createdBy);
      }
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
    let transaction;
    try {
      const { content, media, setting, mentions, audience } = createPostDto;
      const authUserId = authUser.id;
      const creator = authUser.profile;
      if (!creator) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
      }
      const { groupIds } = audience;
      await this._authorityService.checkCanCreatePost(authUser, groupIds);

      if (mentions && mentions.length) {
        await this._mentionService.checkValidMentions(groupIds, mentions);
      }

      const { files, images, videos } = media;
      const uniqueMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
      await this._mediaService.checkValidMedia(uniqueMediaIds, authUserId);
      transaction = await this._sequelizeConnection.transaction();
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
          isProcessing: false,
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

      return post;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      this._sentryService.captureException(error);
      throw error;
    }
  }

  /**
   * Save post edited history
   * @param postId string
   * @param Object { oldData: PostResponseDto; newData: PostResponseDto }
   * @returns Promise resolve void
   */
  public async savePostEditedHistory(
    postId: string,
    { oldData, newData }: { oldData: PostResponseDto; newData: PostResponseDto }
  ): Promise<any> {
    return this._postEditedHistoryModel.create({
      postId: postId,
      editedAt: newData.updatedAt ?? newData.createdAt,
      oldData: oldData,
      newData: newData,
    });
  }

  /**
   * Update Post except isDraft
   * @param postId string
   * @param authUser UserDto
   * @param updatePostDto UpdatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updatePost(
    post: PostResponseDto,
    authUser: UserDto,
    updatePostDto: UpdatePostDto
  ): Promise<boolean> {
    const authUserId = authUser.id;
    const creator = authUser.profile;
    if (!creator) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_USER_NOT_FOUND);
    }

    let transaction;
    try {
      const { content, media, setting, mentions, audience } = updatePostDto;
      await this.checkContent(updatePostDto);
      await this.checkPostOwner(post, authUser.id);
      const oldGroupIds = post.audience.groups.map((group) => group.id);
      if (audience) {
        await this._authorityService.checkCanUpdatePost(authUser, audience.groupIds);
      }

      if (mentions && mentions.length) {
        await this._mentionService.checkValidMentions(
          audience ? audience.groupIds : oldGroupIds,
          mentions
        );
      }

      const dataUpdate = {
        updatedBy: authUserId,
      };

      if (content !== null) {
        dataUpdate['content'] = content;
      }
      if (setting.hasOwnProperty('canShare')) {
        dataUpdate['canShare'] = setting.canShare;
      }
      if (setting.hasOwnProperty('canComment')) {
        dataUpdate['canComment'] = setting.canComment;
      }
      if (setting.hasOwnProperty('canReact')) {
        dataUpdate['canReact'] = setting.canReact;
      }
      if (setting.hasOwnProperty('isImportant')) {
        dataUpdate['isImportant'] = setting.isImportant;
      }
      if (setting.hasOwnProperty('importantExpiredAt')) {
        dataUpdate['importantExpiredAt'] =
          setting.isImportant === false ? null : setting.importantExpiredAt;
      }
      let newMediaIds = [];
      transaction = await this._sequelizeConnection.transaction();
      if (media) {
        const { files, images, videos } = media;
        newMediaIds = [...new Set([...files, ...images, ...videos].map((i) => i.id))];
        await this._mediaService.checkValidMedia(newMediaIds, authUserId);
        const mediaList =
          newMediaIds.length === 0
            ? []
            : await this._mediaService.getMediaList({ where: { id: newMediaIds } });
        if (
          mediaList.filter(
            (m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.PROCESSING
          ).length > 0
        ) {
          dataUpdate['isDraft'] = true;
          dataUpdate['isProcessing'] = true;
        }
      }

      await this._postModel.update(dataUpdate, {
        where: {
          id: post.id,
          createdBy: authUserId,
        },
        transaction,
      });

      if (media) {
        await this._mediaService.sync(post.id, EntityType.POST, newMediaIds, transaction);
      }

      if (mentions) {
        await this._mentionService.setMention(mentions, MentionableType.POST, post.id, transaction);
      }
      if (audience && !ArrayHelper.arraysEqual(audience.groupIds, oldGroupIds)) {
        await this.setGroupByPost(audience.groupIds, post.id, transaction);
      }
      await transaction.commit();

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
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
  public async publishPost(postId: string, authUserId: number): Promise<boolean> {
    try {
      const post = await this._postModel.findOne({
        where: {
          id: postId,
        },
        include: [
          {
            model: MediaModel,
            through: {
              attributes: [],
            },
            attributes: ['id', 'url', 'type', 'name', 'width', 'height', 'uploadId', 'status'],
            required: false,
          },
        ],
      });
      await this.checkPostOwner(post, authUserId);

      if (post.content === null && post.media.length === 0) {
        ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY);
      }

      if (post.isDraft === false) return false;

      let isDraft = false;
      let isProcessing = false;
      if (
        post.media.filter(
          (m) => m.status === MediaStatus.WAITING_PROCESS || m.status === MediaStatus.PROCESSING
        ).length > 0
      ) {
        isDraft = true;
        isProcessing = true;
      }
      await this._postModel.update(
        {
          isDraft,
          isProcessing,
          createdAt: new Date(),
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
  public async checkPostOwner(
    post: PostResponseDto | PostModel | IPost,
    authUserId: number
  ): Promise<boolean> {
    if (!post) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }

    if (post.createdBy !== authUserId) {
      throw new LogicException(HTTP_STATUS_ID.API_FORBIDDEN);
    }
    return true;
  }

  /**
   * Delete post by id
   * @param postId string
   * @param authUserId auth user ID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deletePost(postId: string, authUser: UserDto): Promise<IPost> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const post = await this._postModel.findByPk(postId);
      await this.checkPostOwner(post, authUser.id);
      await Promise.all([
        this._mentionService.setMention([], MentionableType.POST, postId, transaction),
        this._mediaService.sync(postId, EntityType.POST, [], transaction),
        this.setGroupByPost([], postId, transaction),
        this._reactionService.deleteReactionByPostIds([postId]),
        this._commentService.deleteCommentsByPost(postId, transaction),
        this._feedService.deleteNewsFeedByPost(postId, transaction),
        this._userMarkReadPostModel.destroy({ where: { postId }, transaction }),
      ]);
      await this._postModel.destroy({
        where: {
          id: postId,
          createdBy: authUser.id,
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
   * @param postId string
   */
  public async deletePostEditedHistory(postId: string): Promise<any> {
    return this._postEditedHistoryModel.destroy({
      where: {
        postId: postId,
      },
    });
  }

  /**
   * Add group to post
   * @param groupIds Array of Group ID
   * @param postId string
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addPostGroup(
    groupIds: number[],
    postId: string,
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
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async setGroupByPost(
    groupIds: number[],
    postId: string,
    transaction: Transaction
  ): Promise<boolean> {
    const currentGroups = await this._postGroupModel.findAll({
      where: { postId },
    });
    const currentGroupIds = currentGroups.map((i) => i.groupId);

    const deleteGroupIds = ArrayHelper.arrDifferenceElements(currentGroupIds, groupIds);
    if (deleteGroupIds.length) {
      await this._postGroupModel.destroy({
        where: { groupId: deleteGroupIds, postId },
        transaction,
      });
    }

    const addGroupIds = ArrayHelper.arrDifferenceElements(groupIds, currentGroupIds);
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
      throw new LogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    return post.toJSON();
  }

  public async findPostIdsByGroupId(groupId: number, take = 1000): Promise<string[]> {
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
      this._sentryService.captureException(ex);
      return [];
    }
  }

  public async markReadPost(postId: string, userId: number): Promise<void> {
    const post = await this._postModel.findByPk(postId);
    if (!post) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_NOT_FOUND);
    }
    if (post && post.createdBy === userId) {
      ExceptionHelper.throwLogicException(HTTP_STATUS_ID.APP_POST_AS_READ_NOT_ALLOW);
    }
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
  }

  public async getTotalImportantPostInGroups(
    userId: number,
    groupIds: number[],
    constraints?: string
  ): Promise<number> {
    const { schema } = getDatabaseConfig();
    const query = `SELECT COUNT(*) as total
    FROM ${schema}.posts as p
    WHERE "p"."is_draft" = false AND "p"."important_expired_at" > NOW()
    AND EXISTS(
        SELECT 1
        from ${schema}.posts_groups AS g
        WHERE g.post_id = p.id
        AND g.group_id IN(:groupIds)
      )
    ${constraints ?? ''}`;
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
   * @param postId string
   * @param getPostEditedHistoryDto GetPostEditedHistoryDto
   * @returns Promise resolve PageDto
   */
  public async getPostEditedHistory(
    user: UserDto,
    postId: string,
    getPostEditedHistoryDto: GetPostEditedHistoryDto
  ): Promise<PageDto<PostEditedHistoryDto>> {
    const { schema } = getDatabaseConfig();
    try {
      const post = await this.findPost({ postId: postId });
      await this.checkPostOwner(post, user.id);

      const { idGT, idGTE, idLT, idLTE, endTime, offset, limit, order } = getPostEditedHistoryDto;

      if (post.isDraft === true) {
        return new PageDto([], {
          limit: limit,
          total: 0,
        });
      }

      const conditions = {};
      conditions['postId'] = postId;

      if (idGT) {
        conditions['id'] = {
          [Op.not]: idGT,
          ...conditions['id'],
        };
        conditions['editedAt'] = {
          [Op.gte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this._sequelizeConnection.escape(
            idGT
          )}
          `),
          ...conditions['editedAt'],
        };
      }

      if (idGTE) {
        conditions['editedAt'] = {
          [Op.gte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this._sequelizeConnection.escape(
            idGTE
          )}
          `),
          ...conditions['editedAt'],
        };
      }

      if (idLT) {
        conditions['id'] = {
          [Op.not]: idLT,
          ...conditions['id'],
        };
        conditions['editedAt'] = {
          [Op.lte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this._sequelizeConnection.escape(
            idLT
          )}
          `),
          ...conditions['editedAt'],
        };
      }

      if (idLTE) {
        conditions['editedAt'] = {
          [Op.lte]: sequelize.literal(`
            SELECT "peh".edited_at FROM ${schema}.post_edited_history AS "peh" WHERE "peh".id = ${this._sequelizeConnection.escape(
            idLT
          )}
          `),
          ...conditions['editedAt'],
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
        order: [['id', order]],
        offset: offset,
        limit: limit,
      });

      const result = rows.map((e) => {
        const newData: PostResponseDto = e.toJSON().newData;
        return plainToInstance(
          PostEditedHistoryDto,
          {
            ...newData,
            postId: newData.id,
            editedAt: newData.updatedAt ?? newData.createdAt,
          },
          { excludeExtraneousValues: true }
        );
      });

      return new PageDto(result, {
        limit: limit,
        total: count,
      });
    } catch (e) {
      this._logger.error(e, e?.stack);
      throw e;
    }
  }

  public async getPostsByMedia(uploadId: string): Promise<PostResponseDto[]> {
    const posts = await this._postModel.findAll({
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
          attributes: ['id', 'url', 'type', 'name', 'width', 'height'],
          required: true,
          where: {
            uploadId,
          },
        },
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
    });

    const jsonPosts = posts.map((p) => p.toJSON());
    await Promise.all([
      this.bindAudienceToPost(jsonPosts),
      this._mentionService.bindMentionsToPosts(jsonPosts),
      this.bindActorToPost(jsonPosts),
    ]);
    const result = this._classTransformer.plainToInstance(PostResponseDto, jsonPosts, {
      excludeExtraneousValues: true,
    });
    return result;
  }

  public async updatePostStatus(postId: string): Promise<void> {
    const { schema } = getDatabaseConfig();
    const postMedia = PostMediaModel.tableName;
    const post = PostModel.tableName;
    const media = MediaModel.tableName;
    const query = ` UPDATE ${schema}.${post}
                SET is_processing = tmp.is_processing, is_draft = tmp.is_processing
                FROM (
                  SELECT pm.post_id, CASE WHEN SUM ( CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END 
		                ) < COUNT(m.id) THEN true ELSE false END as is_processing
                  FROM ${schema}.${media} as m
                  JOIN ${schema}.${postMedia} AS pm ON pm.media_id = m.id
                  WHERE pm.post_id = :postId
                  GROUP BY pm.post_id
                ) as tmp 
                WHERE tmp.post_id = ${schema}.${post}.id`;
    await this._sequelizeConnection.query(query, {
      replacements: {
        postId,
      },
      type: QueryTypes.UPDATE,
      raw: true,
    });
  }

  public async videoPostSuccess(processVideoResponseDto: ProcessVideoResponseDto): Promise<void> {
    const { videoId, hlsUrl, meta } = processVideoResponseDto;
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.COMPLETED });
    const posts = await this.getPostsByMedia(videoId);
    posts.forEach((post) => {
      this.updatePostStatus(post.id);
    });
  }

  public async videoPostFail(processVideoResponseDto: ProcessVideoResponseDto): Promise<void> {
    const { videoId, hlsUrl, meta } = processVideoResponseDto;
    await this._mediaService.updateData([videoId], { url: hlsUrl, status: MediaStatus.FAILED });
    const posts = await this.getPostsByMedia(videoId);
    posts.forEach((post) => {
      this.updatePostStatus(post.id);
    });
  }

  public async processVideo(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      this._client.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: JSON.stringify({ videoIds: ids }),
      });
      this._mediaService.updateData(ids, { status: MediaStatus.PROCESSING });
    } catch (e) {
      this._logger.error(e, e?.stack);
      this._sentryService.captureException(e);
    }
  }

  public checkContent(updatePostDto: UpdatePostDto): void {
    const { content, media } = updatePostDto;
    if (
      content === '' &&
      media?.files.length === 0 &&
      media?.videos.length === 0 &&
      media?.images.length === 0
    ) {
      throw new LogicException(HTTP_STATUS_ID.APP_POST_PUBLISH_CONTENT_EMPTY);
    }
  }
}
