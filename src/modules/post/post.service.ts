import { UserSharedDto } from './../../shared/user/dto/user-shared.dto';
import { Sequelize } from 'sequelize-typescript';
import { UserService } from './../../shared/user/user.service';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToClass } from 'class-transformer';
import { PostModel } from '../../database/models/post.model';
import { MediaType } from '../../database/models/media.model';
import { CreatePostDto, GetPostDto } from './dto/requests';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PostResponseDto } from './dto/responses';
import { CreatedPostEvent } from 'src/events/post';
import { MediaModel } from 'src/database/models/media.model';
import { PostMediaModel } from 'src/database/models/post-media.model';
import { GroupService } from 'src/shared/group';
import { MediaService } from '../media/media.service';
import { FileDto, VideoDto, ImageDto } from './dto/common/media.dto';
import { MentionableType } from 'src/common/constants';

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
    private _eventEmitter: EventEmitter2,
    private _userService: UserService,
    private _groupService: GroupService,
    private _mediaService: MediaService
  ) {}

  /**
   * Create Post
   * @param authUser UserSharedDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve recentSearchPostDto
   * @throws HttpException
   */
  public async createPost(authUser: UserSharedDto, createPostDto: CreatePostDto) {
    const { isDraft, data, setting, mentions, audience } = createPostDto;
    const creator = await this._userService.get(authUser.userId);
    if (!creator) {
      throw new HttpException(`UserID ${authUser.userId} not found`, HttpStatus.BAD_REQUEST);
    }

    const { groups } = audience;
    if (!this._groupService.isMemberOfGroups(groups, creator.groups)) {
      throw new HttpException('You can not create post in this groups', HttpStatus.BAD_REQUEST);
    }
    const mentionUserIds = mentions.map((i) => i.userId);
    this.checkValidMention(mentionUserIds, groups);

    const { files, videos, images } = data;
    const mediaIds = [];
    mediaIds.push(...files.map((i) => i.id));
    mediaIds.push(...videos.map((i) => i.id));
    mediaIds.push(...images.map((i) => i.id));
    this.checkValidMedia(mediaIds, authUser.userId);

    const transaction = await this._sequelizeConnection.transaction();
    try {
      const post = await this._postModel.create({
        isDraft,
        content: data.content,
        createdBy: authUser.userId,
        updatedBy: authUser.userId,
        isImportant: setting.isImportant,
        importantExpiredAt: setting.importantExpiredAt,
        canShare: setting.canShare,
        canComment: setting.canComment,
        canReact: setting.canReact,
      });

      if (mediaIds.length) {
        await post.addMedia(mediaIds);
      }

      if (mentionUserIds.length) {
        // await this._mentionService.create(post.id, mentionUserIds, MentionableType.POST);
      }

      this._eventEmitter.emit(
        CreatedPostEvent.event,
        new CreatedPostEvent({
          post,
          actor: authUser,
          mentions,
          audience,
          setting,
        })
      );

      await transaction.commit();

      return post;
    } catch (error) {
      await transaction.rollback();
      this._logger.error(error, error?.stack);
      //this.sentryService.captureException(error);
      throw new HttpException("Can't create recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate Mention
   * @param mentionUserIds Array of mention's userID
   * @param audienceGroups audience groups of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async checkValidMention(
    mentionUserIds: number[],
    audienceGroups: number[]
  ): Promise<boolean> {
    if (mentionUserIds.length === 0) return true;
    const mentionUsers = await this._userService.getMany(mentionUserIds);
    mentionUsers.forEach((userInfo) => {
      if (!this._groupService.isMemberOfGroups(audienceGroups, userInfo.groups)) {
        throw new HttpException(
          `User ${userInfo.userId}} is not in this group`,
          HttpStatus.BAD_REQUEST
        );
      }
    });
    return true;
  }

  /**
   * Validate Mention
   * @param media { files, videos, images }
   * @param createdBy created_by of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async checkValidMedia(mediaIds: number[], createdBy: number): Promise<boolean> {
    if (mediaIds.length === 0) return true;

    const getMediaList = await this._mediaService.getMediaList({
      where: {
        id: mediaIds,
        createdBy,
      },
    });

    if (getMediaList.length < mediaIds.length) {
      throw new HttpException('Media ID is invalid', HttpStatus.BAD_REQUEST);
    }

    return true;
  }

  /**
   * Get post by id
   * @param id Number
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async getPost(id: number) {
    // try {
    const post = await this._postModel.findOne({
      where: { id },
      include: [
        {
          model: MediaModel,
          through: {
            attributes: [],
          },
        },
      ],
      order: [
        [
          { model: PostMediaModel, as: 'mediaList' },
          { model: MediaModel, as: 'media' },
          'created_at',
          'desc',
        ],
      ],
    });
    //const { mediaList } = post;
    const files = [];
    const images = [];
    const videos = [];
    // mediaList.forEach((item) => {
    //   switch (item.media.type) {
    //     case 'video':
    //       videos.push(item.media);
    //       break;
    //     case 'image':
    //       images.push(item.media);
    //       break;
    //     case 'file':
    //       files.push(item.media);
    //       break;
    //   }
    // });
    return {
      files,
      videos,
      images,
      post,
    };
    //} catch (error) {
    // this._logger.error(error);
    //this.sentryService.captureException(error);

    //throw new HttpException("Can't delete recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    // }
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
