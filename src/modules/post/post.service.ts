import { MentionableType } from '../../common/constants';
import { Sequelize } from 'sequelize-typescript';
import { UserService } from '../../shared/user';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IPost, PostModel } from '../../database/models/post.model';
import { CreatePostDto } from './dto/requests';
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { GroupService } from '../../shared/group/group.service';
import { IMedia } from '../../database/models/media.model';
import { MentionService } from '../mention';
import {
  CreatedPostEvent,
  DeletedPostEvent,
  PublishedPostEvent,
  UpdatedPostEvent,
} from '../../events/post';
import { PostGroupModel } from '../../database/models/post-group.model';
import { ArrayHelper } from '../../common/helpers';
import { EntityIdDto } from '../../common/dto';
import { CommentModel } from '../../database/models/comment.model';
import { PostReactionModel } from '../../database/models/post-reaction.model';
import { CommentReactionModel } from '../../database/models/comment-reaction.model';
import { UpdatePostDto } from './dto/requests/update-post.dto';
import { MentionModel } from '../../database/models/mention.model';
import { MediaModel } from '../../database/models/media.model';
import { getDatabaseConfig } from '../../config/database';
import { QueryTypes } from 'sequelize';

@Injectable()
export class PostService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(PostService.name);

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
    private _mentionService: MentionService
  ) {}

  /**
   * Create Post
   * @param authUser UserDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async createPost(authUserId: number, createPostDto: CreatePostDto): Promise<boolean> {
    let transaction;
    try {
      const { isDraft, data, setting, mentions, audience } = createPostDto;
      const creator = await this._userService.get(authUserId);
      if (!creator) {
        throw new HttpException(`UserID ${authUserId} not found`, HttpStatus.BAD_REQUEST);
      }

      const { groups } = audience;
      const groupIds = groups.map((i) => i.id);
      const isMember = await this._groupService.isMemberOfGroups(groupIds, creator.groups);
      if (!isMember) {
        throw new HttpException('You can not create post in this groups', HttpStatus.BAD_REQUEST);
      }
      const mentionUserIds = mentions.map((i) => i.id);
      if (mentionUserIds.length) {
        await this._mentionService.checkValidMentions(groupIds, mentionUserIds);
      }

      const { files, videos, images } = data;
      const unitMediaIds = [...new Set([...files, ...videos, ...images].map((i) => i.id))];
      await this._mediaService.checkValidMedia(unitMediaIds, authUserId);
      transaction = await this._sequelizeConnection.transaction();

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
   * Update Post
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
    let transaction;
    try {
      const { isDraft, data, setting, mentions, audience } = updatePostDto;
      const creator = await this._userService.get(authUserId);
      if (!creator) {
        throw new HttpException(`UserID ${authUserId} not found`, HttpStatus.BAD_REQUEST);
      }

      const { groups } = audience;
      const groupIds = groups.map((i) => i.id);
      const isMember = await this._groupService.isMemberOfGroups(groupIds, creator.groups);
      if (!isMember) {
        throw new HttpException('You can not create post in this groups', HttpStatus.BAD_REQUEST);
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

      transaction = await this._sequelizeConnection.transaction();
      await this._postModel.update(
        {
          isDraft,
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
            isDraft,
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
      const authInfo = await this._userService.get(authUserId);
      const { setting, id, data, groups, mentions, commentsCount } = post;
      const mentionIds = mentions.map((i) => i.userId);
      const dataMentions = await this._mentionService.resolveMentions(mentionIds);
      const groupIds = groups.map((i) => i.groupId);
      const dataGroups = await this._groupService.getMany(groupIds);

      this._eventEmitter.emit(
        PublishedPostEvent.event,
        new PublishedPostEvent({
          id,
          isDraft: false,
          data,
          commentsCount,
          actor: authInfo,
          mentions: dataMentions,
          audience: {
            groups: dataGroups,
          },
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
      throw new HttpException('The post not found', HttpStatus.NOT_FOUND);
    }

    if (post.createdBy !== authUserId) {
      throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
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
   * Get post by id
   * @param id Number
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async getPost(id: number) {
    return null;
    //return this._postModel.findOne({ where: { id } });
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
      await this._checkPostExistAndOwner(post, authUserId);

      await this._postModel.destroy({
        where: {
          id: postId,
          createdBy: authUserId,
        },
      });
      await this._mentionService.setMention([], MentionableType.POST, postId);
      await this._mediaService.setMediaByPost([], postId);
      await this.setGroupByPost([], postId);
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
    return post;
  }
}
