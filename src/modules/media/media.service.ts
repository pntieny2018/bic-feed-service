import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UserDto } from '../auth';
import {
  FileMetadataDto,
  ImageMetadataDto,
  MediaDto,
  RemoveMediaDto,
  VideoMetadataDto,
} from './dto';
import { EntityType } from './media.constants';
import { ModelStatic, Sequelize } from 'sequelize-typescript';
import { ArrayHelper } from '../../common/helpers';
import { plainToInstance } from 'class-transformer';
import { MediaFilterResponseDto } from './dto/response';
import { Attributes, FindOptions, Op, QueryTypes, Transaction } from 'sequelize';
import { getDatabaseConfig } from '../../config/database';
import { UploadType } from '../upload/dto/requests/upload.dto';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { PostMediaModel } from '../../database/models/post-media.model';
import { CommentMediaModel } from '../../database/models/comment-media.model';
import { IMedia, MediaModel, MediaStatus, MediaType } from '../../database/models/media.model';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';
import { SentryService } from '@app/sentry';
import { FileMetadataResponseDto } from './dto/response/file-metadata-response.dto';
import { ImageMetadataResponseDto } from './dto/response/image-metadata-response.dto';
import { VideoMetadataResponseDto } from './dto/response/video-metadata-response.dto';

@Injectable()
export class MediaService {
  private _logger = new Logger(MediaService.name);
  public constructor(
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(PostMediaModel) private _postMediaModel: typeof PostMediaModel,
    @InjectModel(CommentMediaModel) private _commentMediaModel: typeof CommentMediaModel,
    private readonly _sentryService: SentryService
  ) {}

  /**
   * Create media
   * @param user UserDto
   * @param url String
   * @param mediaType MediaType
   */
  public async create(
    user: UserDto,
    {
      url,
      uploadType,
      name,
      originName,
      extension,
      width,
      height,
      status,
      size,
      mimeType,
    }: {
      url: string;
      uploadType: UploadType;
      name: string;
      originName: string;
      extension: string;
      width: number;
      height: number;
      status: MediaStatus;
      size?: number;
      mimeType?: string;
    }
  ): Promise<any> {
    this._logger.debug(
      `[create]: ${JSON.stringify(user)} ${JSON.stringify({
        url,
        uploadType,
        name,
        originName,
        extension,
        width,
        height,
        status,
      })}`
    );
    try {
      const typeArr = uploadType.split('_');
      return await this._mediaModel.create({
        name,
        originName,
        createdBy: user.id,
        url,
        extension,
        type: typeArr[1] as MediaType,
        width: width,
        height: height,
        status,
        size: size ?? null,
        mimeType: mimeType ?? null,
      });
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new InternalServerErrorException("Can't create media");
    }
  }

  /**
   *  Delete media
   * @param user UserDto UserDto
   * @param removeMediaDto RemoveMediaDto
   */
  public async destroy(user: UserDto, removeMediaDto: RemoveMediaDto): Promise<any> {
    const trx = await this._sequelizeConnection.transaction();
    try {
      if (removeMediaDto.postId) {
        await this._postMediaModel.destroy({
          where: {
            mediaId: removeMediaDto.mediaIds,
            postId: removeMediaDto.postId,
          },
        });
      }

      if (removeMediaDto.commentId) {
        await this._commentMediaModel.destroy({
          where: {
            mediaId: removeMediaDto.mediaIds,
            commentId: removeMediaDto.commentId,
          },
        });
      }

      await this._mediaModel.destroy({
        where: {
          id: removeMediaDto.mediaIds,
        },
      });

      await trx.commit();
      return true;
    } catch (ex) {
      this._logger.error(ex, ex.stack);
      this._sentryService.captureException(ex);
      await trx.rollback();
      throw new LogicException(HTTP_STATUS_ID.API_MEDIA_DELETE_ERROR);
    }
  }

  /**
   *  Get media list
   * @param options FindOptions
   */
  public async getMediaList(options?: FindOptions<IMedia>): Promise<MediaModel[]> {
    return await this._mediaModel.findAll(options);
  }

  /**
   * Validate Mention
   * @param mediaIds Array of media ID
   * @param createdBy created_by of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async checkValidMedia(mediaIds: string[], createdBy: number): Promise<boolean> {
    if (mediaIds.length === 0) return true;

    const getMediaList = await this._mediaModel.findAll({
      where: {
        id: mediaIds,
      },
    });

    if (getMediaList.filter((media) => media.createdBy !== createdBy).length > 0) {
      throw new HttpException('Media ID is invalid', HttpStatus.BAD_REQUEST);
    }

    return true;
  }

  public async createIfNotExist(
    data: MediaDto,
    createdBy: number,
    transaction: Transaction
  ): Promise<IMedia[]> {
    const { images, files, videos } = data;
    const insertData = [];
    const mediaIds = [];
    images.forEach((i) => {
      mediaIds.push(i.id);
      insertData.push({
        id: i.id,
        name: i.name ?? null,
        originName: i.originName ?? null,
        size: i.size ?? 0,
        url: i.url ?? null,
        width: i.width ?? null,
        type: MediaType.IMAGE,
        createdBy,
        updatedBy: createdBy,
        height: i.height ?? null,
        status: i.status ?? MediaStatus.COMPLETED,
      });
    });

    files.forEach((i) => {
      mediaIds.push(i.id);
      insertData.push({
        id: i.id,
        name: i.name ?? null,
        originName: i.originName ?? null,
        extension: i.extension ?? null,
        mimeType: i.mimeType ?? null,
        size: i.size ?? 0,
        url: i.url ?? null,
        type: MediaType.FILE,
        createdBy,
        updatedBy: createdBy,
        width: null,
        height: null,
        status: i.status ?? MediaStatus.COMPLETED,
      });
    });

    videos.forEach((i) => {
      mediaIds.push(i.id);
      insertData.push({
        id: i.id,
        name: i.name ?? null,
        originName: i.originName ?? null,
        size: i.size ?? 0,
        type: MediaType.VIDEO,
        createdBy,
        updatedBy: createdBy,
        url: i.url ?? null,
        width: null,
        height: null,
        status: i.status ?? MediaStatus.COMPLETED,
        thumbnails: i.thumbnails ?? [],
      });
    });

    const existingMeidaList = await this._mediaModel.findAll({
      where: {
        id: mediaIds,
      },
    });
    const existingMediaIds = existingMeidaList.map((m) => m.id);
    await this._mediaModel.bulkCreate(
      insertData.filter((i) => !existingMediaIds.includes(i.id)),
      { transaction }
    );
    return insertData;
  }

  /**
   * Update Media.isDraft, called when update Post
   * @param mediaIds Array of Media ID
   * @param transaction Transaction
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async updateMediaDraft(mediaIds: number[], transaction: Transaction): Promise<boolean> {
    const { schema } = getDatabaseConfig();
    const postMedia = PostMediaModel.tableName;
    const commentMedia = CommentMediaModel.tableName;
    if (mediaIds.length === 0) return true;
    const query = ` UPDATE ${schema}.media
                SET is_draft = tmp.not_has_post
                FROM (
                  SELECT media.id, 
                  CASE WHEN COUNT(${postMedia}.post_id) + COUNT(${commentMedia}.comment_id) > 0 THEN false ELSE true
                  END as not_has_post
                  FROM ${schema}.media
                  LEFT JOIN ${schema}.${postMedia} ON ${postMedia}.media_id = media.id
                  LEFT JOIN ${schema}.${commentMedia} ON ${commentMedia}.media_id = media.id
                  WHERE media.id IN (:mediaIds)
                  GROUP BY media.id
                ) as tmp 
                WHERE tmp.id = ${schema}.media.id`;
    await this._sequelizeConnection.query(query, {
      replacements: {
        mediaIds,
      },
      type: QueryTypes.UPDATE,
      raw: true,
      transaction: transaction,
    });
    return true;
  }

  public async sync(
    entityId: string,
    entityType: EntityType,
    mediaIds: string[],
    transaction: Transaction
  ): Promise<void> {
    const changes = {
      attached: [],
      detached: [],
    };

    const condition =
      entityType === EntityType.POST
        ? {
            attributes: ['mediaId'],
            where: {
              postId: entityId,
            },
          }
        : {
            attributes: ['mediaId'],
            where: {
              commentId: entityId,
            },
          };

    const currentMedia = await (entityType === EntityType.POST
      ? this._postMediaModel.findAll(condition)
      : this._commentMediaModel.findAll(condition));

    const currentMediaIds = currentMedia.map((m) => m.mediaId);

    changes.attached = ArrayHelper.arrDifferenceElements(mediaIds, currentMediaIds);

    changes.detached = ArrayHelper.arrDifferenceElements(currentMediaIds, mediaIds);

    const getAttachedData = (
      data: number[],
      entityKey: string,
      entityId: string,
      mediaKey: string
    ): any[] =>
      data.map((id) => ({
        [entityKey]: entityId,
        [mediaKey]: id,
      }));

    const getDetachedData = (
      data: number[],
      entityKey: string,
      entityId: string,
      mediaKey: string
    ): object => ({
      where: {
        [entityKey]: entityId,
        [mediaKey]: {
          [Op.in]: data,
        },
      },
      transaction: transaction,
    });

    if (changes.attached.length) {
      await (entityType === EntityType.POST
        ? this._postMediaModel.bulkCreate(
            getAttachedData(changes.attached, 'postId', entityId, 'mediaId'),
            { transaction }
          )
        : this._commentMediaModel.bulkCreate(
            getAttachedData(changes.attached, 'commentId', entityId, 'mediaId')
          ));
    }

    if (changes.detached.length) {
      await (entityType === EntityType.POST
        ? this._postMediaModel.destroy(
            getDetachedData(changes.detached, 'postId', entityId, 'mediaId')
          )
        : this._commentMediaModel.destroy(
            getDetachedData(changes.detached, 'commentId', entityId, 'mediaId')
          ));
    }

    await this.updateMediaDraft([...changes.attached, ...changes.detached], transaction);
  }

  public destroyCommentMedia(user: UserDto, commentId: number): Promise<void> {
    const databaseConfig = getDatabaseConfig();
    return this._sequelizeConnection.query(
      `DELETE FROM ${databaseConfig.schema}.${CommentMediaModel.tableName} 
               WHERE 
             ${databaseConfig.schema}.${CommentMediaModel.tableName}.comment_id = $commentId`,
      {
        type: QueryTypes.DELETE,
        bind: {
          commentId: commentId,
        },
      }
    );
  }

  /**
   * Filter media type
   * @param media IMedia[]
   * @returns object
   */
  public static filterMediaType(media: IMedia[]): MediaFilterResponseDto {
    const mediaTypes = {
      files: [],
      videos: [],
      images: [],
    };
    media.forEach((media: IMedia) => {
      const TypeMediaDto =
        media.type === 'file'
          ? FileMetadataResponseDto
          : media.type === 'image'
          ? ImageMetadataResponseDto
          : VideoMetadataResponseDto;
      const typeMediaDto = plainToInstance(TypeMediaDto, media, { excludeExtraneousValues: true });
      if (mediaTypes[`${media.type}s`]) mediaTypes[`${media.type}s`].push(typeMediaDto);
    });
    return mediaTypes;
  }

  public async deleteMediaByEntityIds(
    entityIds: string[],
    entityType: EntityType,
    transaction: Transaction
  ): Promise<void> {
    const condition =
      entityType === EntityType.POST
        ? {
            attributes: ['mediaId'],
            where: {
              postId: entityIds,
            },
          }
        : {
            attributes: ['mediaId'],
            where: {
              commentId: entityIds,
            },
          };

    const media = await (entityType === EntityType.POST
      ? this._postMediaModel.findAll(condition)
      : this._commentMediaModel.findAll(condition));

    const mediaIds = media.map((m) => m.mediaId);

    await (entityType === EntityType.POST
      ? this._postMediaModel.destroy({ where: { postId: entityIds }, transaction: transaction })
      : this._commentMediaModel.destroy({
          where: { commentId: entityIds },
          transaction: transaction,
        }));

    await this.updateMediaDraft(mediaIds, transaction);
  }

  public async countMediaByPost(postId: string): Promise<number> {
    return await this._postMediaModel.count({
      where: { postId },
    });
  }

  public async updateData(
    ids: string[],
    dataUpdate: {
      name?: string;
      size?: number;
      url?: string;
      status: MediaStatus;
      mimeType?: string;
    }
  ): Promise<void> {
    await this._mediaModel.update(dataUpdate, {
      where: {
        id: ids,
      },
    });
  }
}
