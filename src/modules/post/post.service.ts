import { MentionableType } from '../../common/constants';
import { Sequelize } from 'sequelize-typescript';
import { UserService } from '../../shared/user';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPost, PostModel } from '../../database/models/post.model';
import { CreatePostDto, GetPostDto } from './dto/requests';
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
import { ArrayHelper } from '../../common/helpers';
import { EntityIdDto, OrderEnum } from '../../common/dto';
import { CommentModel } from '../../database/models/comment.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { UpdatePostDto } from './dto/requests/update-post.dto';
import { MentionModel } from '../../database/models/mention.model';
import { MediaModel } from '../../database/models/media.model';
import { getDatabaseConfig } from '../../config/database';
import { QueryTypes } from 'sequelize';
import { triggerAsyncId } from 'async_hooks';
import sequelize from 'sequelize';
import { CommentService } from '../comment/comment.service';
import { UserDto } from '../auth';
import { ClassTransformer, plainToClass, plainToInstance } from 'class-transformer';
import { PostResponseDto } from './dto/responses';
import { AudienceDto } from './dto/common/audience.dto';
import { UserSharedDto } from '../../shared/user/dto';
import { AuthorityService } from '../authority';

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
    private _authorityService: AuthorityService
  ) {}

  /**
   * Get Post
   * @param postId number
   * @param user UserDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async getPost(postId: number, user: UserDto, getPostDto: GetPostDto) {
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
    const { audience, actor, mentions } = await this.getExtraData(post);

    const result = this._classTransformer.plainToInstance(
      PostResponseDto,
      { ...post.toJSON(), audience, actor, mentions, comments },
      {
        excludeExtraneousValues: true,
      }
    );

    return result;
  }

  /**
   * Get audience, actor and mentions by Post
   * @param post Post model
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async getExtraData(post: PostModel): Promise<{
    audience: AudienceDto;
    actor: UserSharedDto | null;
    mentions: UserSharedDto[];
  }> {
    const result = {
      audience: { groups: [] },
      actor: null,
      mentions: [],
    };
    const groupIds = post.groups.map((i) => i.groupId);
    result.audience.groups = await this._groupService.getMany(groupIds);
    const userIds = post.mentions.map((i) => i.userId);
    userIds.push(post.createdBy);
    const users = await this._userService.getMany(userIds);

    const user = users.find((i) => i.id === post.createdBy);

    result.actor = plainToInstance(UserSharedDto, user, {
      excludeExtraneousValues: true,
    });
    result.mentions = post.mentions.map((mention) => {
      const mentionedUser = users.find((u) => u.id === mention.userId);
      return plainToInstance(UserSharedDto, mentionedUser, {
        excludeExtraneousValues: true,
      });
    });
    return result;
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
      const { isDraft, data, setting, mentions, audience } = createPostDto;
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

      const { files, videos, images } = data;
      const unitMediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      await this._mediaService.checkValidMedia(unitMediaIds, authUserId);

      const post = await this._postModel.create({
        isDraft,
        content: data.content,
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
          data,
          actor: creator,
          mentions,
          audience,
          setting,
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
      const { data, setting, mentions, audience } = updatePostDto;
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

      const { files, videos, images } = data;
      const unitMediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      await this._mediaService.checkValidMedia(unitMediaIds, authUserId);

      await this._postModel.update(
        {
          content: data.content,
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
            data,
            actor: creator,
            mentions,
            audience,
            setting,
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

      const extraPost = await this.getExtraData(post);

      const { id, data, commentsCount, actor, mentions, audience, setting } =
        this._classTransformer.plainToInstance(
          PostResponseDto,
          {
            ...post.toJSON(),
            audience: extraPost.audience,
            actor: extraPost.actor,
            mentions: extraPost.mentions,
          },
          {
            excludeExtraneousValues: true,
          }
        );

      this._eventEmitter.emit(
        PublishedPostEvent.event,
        new PublishedPostEvent({
          id,
          isDraft: false,
          data,
          commentsCount,
          actor,
          mentions,
          audience,
          setting,
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
}
