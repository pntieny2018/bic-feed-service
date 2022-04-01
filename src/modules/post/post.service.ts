import { PageDto } from './../../common/dto/pagination/page.dto';
import { MentionableType } from '../../common/constants';
import { Sequelize } from 'sequelize-typescript';
import { UserService } from '../../shared/user';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPost, PostModel } from '../../database/models/post.model';
import { CreatePostDto, GetPostDto, SearchPostsDto } from './dto/requests';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { GroupService } from '../../shared/group/group.service';
import { MentionService } from '../mention';
import {
  CreatedPostEvent,
  DeletedPostEvent,
  PublishedPostEvent,
  UpdatedPostEvent,
} from '../../events/post';
import { PostGroupModel } from '../../database/models/post-group.model';
import { ArrayHelper, ElasticsearchHelper } from '../../common/helpers';
import { EntityIdDto, OrderEnum } from '../../common/dto';
import { CommentModel } from '../../database/models/comment.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { UpdatePostDto } from './dto/requests/update-post.dto';
import { MentionModel } from '../../database/models/mention.model';
import { MediaModel } from '../../database/models/media.model';
import { getDatabaseConfig } from '../../config/database';
import { QueryTypes } from 'sequelize';
import { CommentService } from '../comment/comment.service';
import { UserDto } from '../auth';
import { ClassTransformer, plainToClass, plainToInstance } from 'class-transformer';
import { PostResponseDto } from './dto/responses';
import { AuthorityService } from '../authority';
import { GetDraftPostDto } from './dto/requests/get-draft-posts.dto';
import { ElasticsearchService } from '@nestjs/elasticsearch';

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
    private _eventEmitter: EventEmitter2,
    private _userService: UserService,
    private _groupService: GroupService,
    private _mediaService: MediaService,
    private _mentionService: MentionService,
    @Inject(forwardRef(() => CommentService))
    private _commentService: CommentService,
    private _authorityService: AuthorityService,
    private _searchService: ElasticsearchService
  ) {}

  /**
   * Get Draft Posts
   * @param authUserId auth user ID
   * @param getDraftPostDto GetDraftPostDto
   * @returns Promise resolve PageDto<PostResponseDto>
   * @throws HttpException
   */
  public async searchPosts(
    authUserId: number,
    searchPostsDto: SearchPostsDto
  ): Promise<PageDto<PostResponseDto>> {
    const { content, limit, offset } = searchPostsDto;
    const user = await this._userService.get(authUserId);
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

    await this.bindActorToPost(posts);
    await this.bindAudienceToPost(posts);
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
    { startTime, endTime, content, actors, limit, offset }: SearchPostsDto,
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
          createdBy: actors,
        },
      });
    }

    if (groupIds.length) {
      body.query.bool.filter.push({
        terms: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          'audience.groups.id': groupIds,
        },
      });
    }

    if (content) {
      body.query.bool.should.push({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        dis_max: {
          queries: [
            {
              match: { content },
            },
            {
              match: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'content.ascii': {
                  query: content,
                  boost: 0.6,
                },
              },
            },
            {
              match: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'content.ngram': {
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
        // eslint-disable-next-line @typescript-eslint/naming-convention
        pre_tags: ['=='],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        post_tags: ['=='],
        fields: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          content: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            matched_fields: ['content', 'content.ascii', 'content.ngram'],
            // eslint-disable-next-line @typescript-eslint/naming-convention
            type: 'fvh',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            number_of_fragments: 0,
          },
        },
      };

      // eslint-disable-next-line @typescript-eslint/naming-convention
      body['sort'] = [{ _score: 'desc' }, { createdBy: 'desc' }];
    } else {
      body['sort'] = [{ createdBy: 'desc' }];
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
    const payload = {
      index: ElasticsearchHelper.INDEX.POST,
      body,
      from: offset,
      size: limit,
    };
    return payload;
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
    await this._mentionService.bindMentionsToPosts(jsonPosts);
    await this.bindActorToPost(jsonPosts);
    await this.bindAudienceToPost(jsonPosts);

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
    getPostDto: GetPostDto
  ): Promise<PostResponseDto> {
    const post = await this._postModel.findOne({
      attributes: {
        exclude: ['updatedBy'],
        include: [PostModel.loadReactionsCount()],
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
      throw new NotFoundException('Post not found');
    }
    await this._authorityService.allowAccess(user, post);

    const comments = await this._commentService.getComments(
      user,
      {
        postId,
        childLimit: getPostDto.childCommentLimit,
        order: getPostDto.commentOrder,
        limit: getPostDto.commentLimit,
      },
      false
    );
    const postJson = post.toJSON();
    await this._mentionService.bindMentionsToPosts([postJson]);
    await this.bindActorToPost([postJson]);
    await this.bindAudienceToPost([postJson]);
    const result = this._classTransformer.plainToInstance(
      PostResponseDto,
      { ...postJson, comments },
      {
        excludeExtraneousValues: true,
      }
    );

    return result;
  }

  /**
   * Bind Audience To Post.groups
   * @param posts Array of post
   * @returns Promise resolve void
   * @throws HttpException
   */

  public async bindAudienceToPost(posts: any[]): Promise<void> {
    const groupIds = [];
    for (const post of posts) {
      if (post.groups && post.groups.length) {
        groupIds.push(...post.groups.map((m) => m.groupId));
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
          const dataGroup = dataGroups.find((i) => i.id === group.id);
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
   * Create Post
   * @param authUser UserDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async createPost(authUserId: number, createPostDto: CreatePostDto): Promise<boolean> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const { isDraft, content, media, setting, mentions, audience } = createPostDto;
      const creator = await this._userService.get(authUserId);
      if (!creator) {
        throw new BadRequestException(`UserID ${authUserId} not found`);
      }

      const { groups } = audience;
      const groupIds = groups.map((i) => i.id);
      const isMember = await this._groupService.isMemberOfGroups(groupIds, creator.groups);
      if (!isMember) {
        throw new BadRequestException('You can not create post in this groups');
      }
      const mentionUserIds = mentions.map((i) => i.id);
      if (mentionUserIds.length) {
        await this._mentionService.checkValidMentions(groupIds, mentionUserIds);
      }

      const { files, videos, images } = media;
      const unitMediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      await this._mediaService.checkValidMedia(unitMediaIds, authUserId);

      const post = await this._postModel.create({
        isDraft,
        content,
        createdBy: authUserId,
        updatedBy: authUserId,
        isImportant: setting.isImportant,
        importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
        canShare: setting.canShare,
        canComment: setting.canComment,
        canReact: setting.canReact,
      });

      if (unitMediaIds.length) {
        await post.addMedia(unitMediaIds);
        await this._mediaService.activeMedia(unitMediaIds, authUserId);
      }

      this.addPostGroup(groupIds, post.id);

      if (mentionUserIds.length) {
        await this._mentionService.create(
          mentionUserIds.map((userId) => ({
            entityId: post.id,
            userId,
            mentionableType: MentionableType.POST,
          }))
        );
      }

      this._eventEmitter.emit(
        CreatedPostEvent.event,
        new CreatedPostEvent({
          id: post.id,
          isDraft,
          commentsCount: post.commentsCount,
          content: post.content,
          media: { files, videos, images },
          actor: creator,
          createdAt: post.createdAt,
          mentions,
          audience,
          setting,
          createdBy: post.createdBy,
        })
      );
      await transaction.commit();

      return true;
    } catch (error) {
      if (typeof transaction !== 'undefined') await transaction.rollback();
      this._logger.error(error, error?.stack);
      throw error;
    }
  }

  /**
   * Update Post except isDraft
   * @param postId postID
   * @param authUserId userID
   * @param createPostDto UpdatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updatePost(
    postId: number,
    authUserId: number,
    updatePostDto: UpdatePostDto
  ): Promise<boolean> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const { content, media, setting, mentions, audience } = updatePostDto;
      const creator = await this._userService.get(authUserId);
      if (!creator) {
        throw new BadRequestException(`UserID ${authUserId} not found`);
      }

      const { groups } = audience;
      const groupIds = groups.map((i) => i.id);
      const isMember = await this._groupService.isMemberOfGroups(groupIds, creator.groups);
      if (!isMember) {
        throw new BadRequestException('You can not create post in this groups');
      }

      const post = await this._postModel.findOne({ where: { id: postId } });
      await this._checkPostExistAndOwner(post, authUserId);

      const mentionUserIds = mentions.map((i) => i.id);
      if (mentionUserIds.length) {
        await this._mentionService.checkValidMentions(groupIds, mentionUserIds);
      }

      const { files, videos, images } = media;
      const unitMediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      await this._mediaService.checkValidMedia(unitMediaIds, authUserId);

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
        }
      );
      await this._mediaService.setMediaByPost(unitMediaIds, postId);
      await this._mentionService.setMention(mentionUserIds, MentionableType.POST, post.id);
      await this.setGroupByPost(groupIds, post.id);

      this._eventEmitter.emit(
        UpdatedPostEvent.event,
        new UpdatedPostEvent({
          updatedPost: {
            id: post.id,
            isDraft: post.isDraft,
            commentsCount: post.commentsCount,
            content: post.content,
            media: { files, videos, images },
            actor: creator,
            mentions,
            audience,
            setting,
            createdAt: post.createdAt,
            createdBy: post.createdBy,
          },
        })
      );
      await transaction.commit();

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
      const post = await this._postModel.findOne({
        where: { id: postId },
        include: [MentionModel, MediaModel, PostGroupModel],
      });
      await this._checkPostExistAndOwner(post, authUserId);

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
      const postJson = post.toJSON();
      await this._mentionService.bindMentionsToPosts([postJson]);
      await this.bindActorToPost([postJson]);
      await this.bindAudienceToPost([postJson]);
      const { id, content, commentsCount, mentions, actor, media, audience, setting } =
        this._classTransformer.plainToInstance(PostResponseDto, postJson, {
          excludeExtraneousValues: true,
        });
      const mentionsConverted = [];
      for (const i in mentions) {
        mentionsConverted.push(Object.values(mentions[i]));
      }
      this._eventEmitter.emit(
        PublishedPostEvent.event,
        new PublishedPostEvent({
          id,
          isDraft: false,
          content,
          media,
          commentsCount,
          actor,
          mentions: mentionsConverted,
          audience,
          setting,
          createdAt: post.createdAt,
          createdBy: post.createdBy,
        })
      );

      return true;
    } catch (error) {
      this._logger.error(error, error?.stack);
      throw error;
    }
  }
  /**
   * Check post exist and owner
   * @param post Post model
   * @param authUserId Auth userID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  private async _checkPostExistAndOwner(post, authUserId): Promise<boolean> {
    if (!post) {
      throw new NotFoundException('The post not found');
    }

    if (post.createdBy !== authUserId) {
      throw new ForbiddenException('Access denied');
    }
    return true;
  }

  /**
   * Update comments count
   * @param postId Post ID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updateCommentCountByPost(postId: number): Promise<boolean> {
    const { schema } = getDatabaseConfig();
    const postTable = PostModel.tableName;
    const commentTable = CommentModel.tableName;
    const query = ` UPDATE ${schema}.${postTable} SET comments_count = (
      SELECT COUNT(id) FROM ${schema}.${commentTable} WHERE post_id = 19
    );`;
    await this._sequelizeConnection.query(query, {
      replacements: {
        postId,
      },
      type: QueryTypes.UPDATE,
      raw: true,
    });
    return true;
  }

  /**
   * Delete post by id
   * @param postId postID
   * @param authUserId auth user ID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async deletePost(postId: number, authUserId: number): Promise<boolean> {
    const transaction = await this._sequelizeConnection.transaction();
    try {
      const post = await this._postModel.findOne({ where: { id: postId } });
      //await this._checkPostExistAndOwner(post, authUserId);
      await this._mentionService.setMention([], MentionableType.POST, postId);
      await this._mediaService.setMediaByPost([], postId);
      await this.setGroupByPost([], postId);
      await this._postModel.destroy({
        where: {
          id: postId,
          createdBy: authUserId,
        },
      });
      this._eventEmitter.emit(DeletedPostEvent.event, new DeletedPostEvent(post));
      transaction.commit();

      return true;
    } catch (error) {
      this._logger.error(error, error?.stack);
      transaction.rollback();
      throw error;
    }
  }

  /**
   * Add group to post
   * @param groupIds Array of Group ID
   * @param postId PostID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async addPostGroup(groupIds: number[], postId: number): Promise<boolean> {
    if (groupIds.length === 0) return true;
    const postGroupDataCreate = groupIds.map((groupId) => ({
      postId: postId,
      groupId,
    }));
    await this._postGroupModel.bulkCreate(postGroupDataCreate);
    return true;
  }

  /**
   * Delete/Insert group by post
   * @param groupIds Array of Group ID
   * @param postId PostID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async setGroupByPost(groupIds: number[], postId: number): Promise<boolean> {
    const currentGroups = await this._postGroupModel.findAll({
      where: { postId },
    });
    const currentGroupIds = currentGroups.map((i) => i.groupId);

    const deleteGroupIds = ArrayHelper.differenceArrNumber(currentGroupIds, groupIds);
    if (deleteGroupIds.length) {
      await this._postGroupModel.destroy({
        where: { groupId: deleteGroupIds, postId },
      });
    }

    const addGroupIds = ArrayHelper.differenceArrNumber(groupIds, currentGroupIds);
    if (addGroupIds.length) {
      await this._postGroupModel.bulkCreate(
        addGroupIds.map((groupId) => ({
          postId,
          groupId,
        }))
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
      throw new BadRequestException('The post does not exist !');
    }
    return post.toJSON();
  }

  public async getCommentCountByPost(postId: number): Promise<number> {
    const post = await this._postModel.findOne({
      attributes: {
        include: [PostModel.loadCommentsCount()],
      },
      where: { id: postId },
    });
    return post.commentsCount ?? 0;
  }
}
