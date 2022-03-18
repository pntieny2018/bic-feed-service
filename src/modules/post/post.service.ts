import { Sequelize } from 'sequelize-typescript';
import { UserService } from './../../shared/user/user.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostModel } from '../../database/models/post.model';
import { CreatePostDto } from './dto/requests';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { MediaService } from '../media/media.service';
import { GroupService } from '../../shared/group/group.service';

import { MentionService } from '../mention';
import { CreatedPostEvent } from '../../events/post/created-post.event';
import { PostGroupModel } from '../../database/models/post-group.model';
import { UserDto } from '../auth';

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
   * @returns Promise resolve recentSearchPostDto
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
      const isMember = await this._groupService.isMemberOfGroups(groups, creator.groups);
      if (!isMember) {
        throw new HttpException('You can not create post in this groups', HttpStatus.BAD_REQUEST);
      }
      const mentionUserIds = mentions.map((i) => i.id);
      if (mentionUserIds.length) {
        await this._mentionService.checkValidMentions(groups, data.content, mentionUserIds);
      }

      const { files, videos, images } = data;
      const mediaIds = [];
      mediaIds.push(...files.map((i) => i.id));
      mediaIds.push(...videos.map((i) => i.id));
      mediaIds.push(...images.map((i) => i.id));
      await this._mediaService.checkValidMedia(mediaIds, authUserId);

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

      if (mediaIds.length) {
        await post.addMedia(mediaIds);
        await this._mediaService.activeMedia(mediaIds, authUserId);
      }

      if (groups.length) {
        const postGroupDataCreate = groups.map((groupId) => {
          return {
            postId: post.id,
            groupId,
          };
        });
        await this._postGroupModel.bulkCreate(postGroupDataCreate);
      }

      if (mentionUserIds.length) {
        // await this._mentionService.create(post.id, mentionUserIds, MentionableType.POST);
      }

      this._eventEmitter.emit(
        CreatedPostEvent.event,
        new CreatedPostEvent({
          post,
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
   * @param authUser UserDto
   * @param createPostDto UpdatePostDto
   * @returns Promise resolve recentSearchPostDto
   * @throws HttpException
   */
  public async updatePost(
    postId: number,
    authUserId: number,
    createPostDto: CreatePostDto
  ): Promise<boolean> {
    let transaction;
    try {
      const { isDraft, data, setting, mentions, audience } = createPostDto;
      const creator = await this._userService.get(authUserId);
      if (!creator) {
        throw new HttpException(`UserID ${authUserId} not found`, HttpStatus.BAD_REQUEST);
      }

      const { groups } = audience;
      const isMember = await this._groupService.isMemberOfGroups(groups, creator.groups);
      if (!isMember) {
        throw new HttpException('You can not create post in this groups', HttpStatus.BAD_REQUEST);
      }

      const post = await this._postModel.findOne({ where: { id: postId } });
      if (!post) {
        throw new HttpException('The post not found', HttpStatus.BAD_REQUEST);
      }

      if (post.createdBy !== authUserId) {
        throw new HttpException('Access denied', HttpStatus.BAD_REQUEST);
      }

      const mentionUserIds = mentions.map((i) => i.id);
      if (mentionUserIds.length) {
        await this._mentionService.checkValidMentions(groups, data.content, mentionUserIds);
      }

      const { files, videos, images } = data;
      const mediaIds = [];
      mediaIds.push(...files.map((i) => i.id));
      mediaIds.push(...videos.map((i) => i.id));
      mediaIds.push(...images.map((i) => i.id));
      await this._mediaService.checkValidMedia(mediaIds, authUserId);

      transaction = await this._sequelizeConnection.transaction();
      post.set({
        isDraft,
        content: data.content,
        updatedBy: authUserId,
        isImportant: setting.isImportant,
        importantExpiredAt: setting.isImportant === false ? null : setting.importantExpiredAt,
        canShare: setting.canShare,
        canComment: setting.canComment,
        canReact: setting.canReact,
      });

      post.save();

      if (mediaIds.length) {
        await post.setMedia(mediaIds);
      }

      if (groups.length) {
        const postGroupDataCreate = groups.map((groupId) => {
          return {
            postId: post.id,
            groupId,
          };
        });
        await this._postGroupModel.bulkCreate(postGroupDataCreate);
      }

      if (mentionUserIds.length) {
        // await this._mentionService.create(post.id, mentionUserIds, MentionableType.POST);
      }

      this._eventEmitter.emit(
        CreatedPostEvent.event,
        new CreatedPostEvent({
          post,
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
   * Delete recent search by id
   * @param createdBy Number
   * @param id Number
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async delete(createdBy: number, id: number): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      this._logger.error(error);
      //this.sentryService.captureException(error);

      throw new HttpException("Can't delete recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
