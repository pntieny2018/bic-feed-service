import { UserDto } from '../auth';
import { FindOptions, QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IMedia } from '../../database/models/media.model';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MediaModel, MediaType } from '../../database/models/media.model';
import { PostMediaModel } from '../../database/models/post-media.model';
import { ArrayHelper } from '../../common/helpers';
import { Op } from 'sequelize';
import { FileDto, ImageDto, VideoDto } from '../post/dto/common/media.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class MediaService {
  private _logger = new Logger(MediaService.name);
  public constructor(
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(PostMediaModel) private _postMedia: typeof PostMediaModel
  ) {}

  /**
   * Create media
   * @param user UserDto
   * @param url String
   * @param mediaType MediaType
   */
  public async create(user: UserDto, url: string, mediaType: MediaType): Promise<any> {
    try {
      return await this._mediaModel.create({
        createdBy: user.userId,
        url: url,
        type: mediaType,
      });
    } catch (ex) {
      throw new InternalServerErrorException("Can't create media");
    }
  }

  /**
   *  Delete media
   * @param user UserDto
   * @param mediaId Number
   */
  public async destroy(user: UserDto, mediaId: number): Promise<any> {
    return await this._mediaModel.destroy({
      where: {
        createdBy: user.userId,
        id: mediaId,
      },
    });
  }

  /**
   *  Get media list
   * @param options FindOptions
   */
  public async getMediaList(options?: FindOptions<IMedia>): Promise<MediaModel[]> {
    const result = await this._mediaModel.findAll(options);

    return result;
  }

  /**
   * Validate Mention
   * @param mediaIds Array of media ID
   * @param createdBy created_by of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async checkValidMedia(mediaIds: number[], createdBy: number): Promise<boolean> {
    if (mediaIds.length === 0) return true;

    const getMediaList = await this._mediaModel.findAll({
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
   * Validate Mention
   * @param mediaIds Array of Media ID
   * @param createdBy created_by of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async activeMedia(mediaIds: number[], createdBy: number): Promise<boolean> {
    if (mediaIds.length === 0) return true;

    await this._mediaModel.update(
      {
        isDraft: false,
      },
      {
        where: { id: mediaIds, createdBy },
      }
    );

    return true;
  }

  /**
   * Delete/Insert and update isDraft for media of post
   * @param mediaIds Array of Media ID
   * @param postId PostID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async setMediaPost(mediaIds: number[], postId: number): Promise<boolean> {
    const currentPostMediaList = await this._postMedia.findAll({
      where: { postId },
    });
    const currentMediaIds = currentPostMediaList.map((i) => i.mediaId);

    const deleteIds = ArrayHelper.differenceArrNumber(currentMediaIds, mediaIds);
    if (deleteIds.length) {
      await this._postMedia.destroy({
        where: { postId, mediaId: deleteIds },
      });
    }

    const addIds = ArrayHelper.differenceArrNumber(mediaIds, currentMediaIds);
    if (addIds.length) {
      await this._postMedia.bulkCreate(
        addIds.map((mediaId) => ({
          postId,
          mediaId,
        }))
      );
    }
    await this.updateMediaDraft([...deleteIds, ...addIds]);
    return true;
  }

  /**
   * Update Media.isDraft, called when update Post
   * @param mediaIds Array of Media ID
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updateMediaDraft(mediaIds: number[]): Promise<boolean> {
    if (mediaIds.length === 0) return true;
    const query = ` UPDATE feed.media
                SET is_draft = tmp.not_has_post
                FROM (
                  SELECT media.id, 
                  CASE WHEN COUNT(post_media.post_id) > 0 THEN false ELSE true
                  END as not_has_post
                  FROM feed.media
                  LEFT JOIN feed.post_media ON post_media.media_id = media.id
                  WHERE media.id IN (:mediaIds)
                  GROUP BY media.id
                ) as tmp 
                WHERE tmp.id = feed.media.id`;
    await this._sequelizeConnection.query(query, {
      replacements: {
        mediaIds,
      },
      type: QueryTypes.UPDATE,
      raw: true,
    });
    return true;
  }

  /**
   * Filter media type
   * @param media Media[]
   * @returns object
   */
  public static filterMediaType(media: IMedia[]): {
    files: FileDto[];
    videos: VideoDto[];
    images: ImageDto[];
  } {
    const mediaTypes = {
      files: [],
      videos: [],
      images: [],
    };
    media.forEach((media: IMedia) => {
      const TypeMediaDto =
        media.type === 'file' ? FileDto : media.type === 'image' ? ImageDto : VideoDto;
      const typeMediaDto = plainToInstance(TypeMediaDto, media);
      mediaTypes[`${media.type}s`].push(typeMediaDto);
    });
    return mediaTypes;
  }
}
