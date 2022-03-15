import { InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToClass } from 'class-transformer';
import { PostModel } from '../../database/models/post.model';
import { MediaType } from '../../database/models/media.model';
import { CreatePostDto, GetPostDto } from './dto/requests';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PostResponseDto } from './dto/responses';
import { UserDto } from '../auth';
import { CreatedPostEvent } from 'src/events/post';
import { MediaModel } from 'src/database/models/media.model';
import { PostMediaModel } from 'src/database/models/post-media.model';
import sequelize from 'sequelize';

@Injectable()
export class PostService {
  /**
   * Logger
   * @private
   */
  private _logger = new Logger(PostService.name);

  public constructor(
    @InjectModel(PostModel)
    private _postModel: typeof PostModel,
    private _eventEmitter: EventEmitter2
  ) {}

  /**
   * Create Post
   * @param authUser UserDto
   * @param createPostDto CreatePostDto
   * @returns Promise resolve recentSearchPostDto
   * @throws HttpException
   */
  public async createPost(authUser: UserDto, createPostDto: CreatePostDto) {
    try {
      const { isDraft, data, setting, mentions, audience } = createPostDto;
      const { groups } = audience;
      //Check Group is invalid

      //Check mentions is invalid

      //check media and store
      const { files, videos, images } = data;

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

      //const result = await this.getPost(post.id);

      //this._eventEmitter.emit(CreatedPostEvent.event, new CreatedPostEvent(result));

      // return result;
    } catch (error) {
      this._logger.error(error, error?.stack);
      //this.sentryService.captureException(error);

      throw new HttpException("Can't create recent search", HttpStatus.INTERNAL_SERVER_ERROR);
    }
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
          model: PostMediaModel,
          as: 'mediaList',
          include: [
            {
              model: MediaModel,
              as: 'media',
              attributes: ['id', 'url', 'type'],
            },
          ],
        },
      ],
      order: [[{ model: PostMediaModel, as: 'mediaList' }, { model: MediaModel, as: 'media' }, 'created_at', 'desc']],
    });
    const { mediaList } = post;
    const files = [];
    const images = [];
    const videos = [];
    mediaList.forEach((item) => {
      switch (item.media.type) {
        case 'video':
          videos.push(item.media);
          break;
        case 'image':
          images.push(item.media);
          break;
        case 'file':
          files.push(item.media);
          break;
      }
    });
    return {
      files,
      videos,
      images,
      post
    };
    if (!post) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
    const { createdBy, mentions, content } = post;

    //get media

    const actor = null;
    //get User from cache

    const result = plainToClass(
      PostResponseDto,
      {
        actor,
        commentCount: 1,
        reactionCount: [{ reactionname: 'abcd', count: 12 }],
        mentions,
        data: {
          content,
          files: [],
          images: [],
          videos: [],
        },
      },
      {
        excludeExtraneousValues: true,
      }
    );
    return result;
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
