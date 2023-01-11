import { SentryService } from '@app/sentry';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { plainToInstance } from 'class-transformer';
import moment from 'moment';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../../common/constants';
import { ArrayHelper } from '../../common/helpers';
import { CommentMediaModel } from '../../database/models/comment-media.model';
import {
  IMedia,
  MediaMarkAction,
  MediaModel,
  MediaStatus,
  MediaType,
} from '../../database/models/media.model';
import { PostMediaModel } from '../../database/models/post-media.model';
import { PostModel } from '../../database/models/post.model';
import { UserDto } from '../auth';
import { UploadType } from '../upload/dto/requests/upload.dto';
import { MediaDto } from './dto';
import { MediaFilterResponseDto } from './dto/response';
import { FileMetadataResponseDto } from './dto/response/file-metadata-response.dto';
import { ImageMetadataResponseDto } from './dto/response/image-metadata-response.dto';
import { VideoMetadataResponseDto } from './dto/response/video-metadata-response.dto';
import { EntityType } from './media.constants';

@Injectable()
export class MediaService {
  private _logger = new Logger(MediaService.name);
  public constructor(
    @InjectConnection() private _sequelizeConnection: Sequelize,
    @InjectModel(MediaModel) private _mediaModel: typeof MediaModel,
    @InjectModel(PostMediaModel) private _postMediaModel: typeof PostMediaModel,
    @InjectModel(CommentMediaModel) private _commentMediaModel: typeof CommentMediaModel,
    @InjectModel(PostModel) private _postModel: typeof PostModel,
    private readonly _sentryService: SentryService,
    @Inject(KAFKA_PRODUCER)
    private readonly _clientKafka: ClientKafka
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
    try {
      const mediaType = uploadType.split('_')[1] as MediaType;
      const media = await this._mediaModel.create({
        name,
        originName,
        createdBy: user.id,
        url,
        extension,
        type: mediaType,
        width: width,
        height: height,
        status,
        size: size ?? null,
        mimeType: mimeType ?? null,
      });
      this.emitMediaToUploadService(mediaType, MediaMarkAction.USED, [media.id], user.id);
      return media;
    } catch (ex) {
      this._sentryService.captureException(ex);
      throw new InternalServerErrorException("Can't create media");
    }
  }

  /**
   * Validate Mention
   * @param mediaIds Array of media ID
   * @param createdBy created_by of post
   * @returns Promise resolve boolean
   * @throws HttpException
   */
  public async isValid(mediaIds: string[], createdBy: string): Promise<boolean> {
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

  public async createIfNotExist(data: MediaDto, createdBy: string): Promise<IMedia[]> {
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
        height: i.height ?? null,
        type: MediaType.IMAGE,
        createdBy,
        updatedBy: createdBy,
        status: i.status ?? MediaStatus.COMPLETED,
        createdAt: i.createdAt ? i.createdAt : new Date(),
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
        createdAt: i.createdAt ? i.createdAt : new Date(),
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
        width: i.width ?? null,
        height: i.height ?? null,
        mimeType: i.mimeType ?? null,
        status: i.status ?? MediaStatus.WAITING_PROCESS,
        thumbnails: i.thumbnails ?? [],
        createdAt: i.createdAt ? i.createdAt : new Date(),
      });
    });

    const existingMediaList = await this._mediaModel.findAll({
      where: {
        id: mediaIds,
      },
    });

    const existingMediaIds = existingMediaList.map((m) => m.id);
    await this._mediaModel.bulkCreate(insertData.filter((i) => !existingMediaIds.includes(i.id)));

    this.emitMediaToUploadService(
      MediaType.VIDEO,
      MediaMarkAction.USED,
      videos.map((e) => e.id),
      createdBy
    );
    this.emitMediaToUploadService(
      MediaType.FILE,
      MediaMarkAction.USED,
      files.map((e) => e.id),
      createdBy
    );

    return this._mediaModel.findAll({
      where: {
        id: mediaIds,
      },
    });
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
      ? this._postMediaModel.findAll({ ...condition, transaction })
      : this._commentMediaModel.findAll({ ...condition, transaction }));

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
            getAttachedData(changes.attached, 'commentId', entityId, 'mediaId'),
            { transaction }
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
  }
  /**
   * Filter media type
   * @returns object
   * @param mediaList
   */
  public static filterMediaType(mediaList: IMedia[]): MediaFilterResponseDto {
    const mediaTypes = {
      files: [],
      videos: [],
      images: [],
    };
    mediaList
      .sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .forEach((media: IMedia) => {
        const TypeMediaDto =
          media.type === 'file'
            ? FileMetadataResponseDto
            : media.type === 'image'
            ? ImageMetadataResponseDto
            : VideoMetadataResponseDto;
        const typeMediaDto = plainToInstance(TypeMediaDto, media, {
          excludeExtraneousValues: true,
        });
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

  public emitMediaToUploadService(
    mediaType: MediaType,
    mediaMarkAction: MediaMarkAction,
    mediaIds: string[],
    userId: string = null
  ): void {
    const [kafkaTopic, keyIds] =
      mediaType === MediaType.FILE
        ? [
            mediaMarkAction === MediaMarkAction.USED
              ? KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_FILE_HAS_BEEN_USED
              : mediaMarkAction === MediaMarkAction.DELETE
              ? KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_FILES
              : null,
            'fileIds',
          ]
        : mediaType === MediaType.VIDEO
        ? [
            mediaMarkAction === MediaMarkAction.USED
              ? KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_VIDEO_HAS_BEEN_USED
              : mediaMarkAction === MediaMarkAction.DELETE
              ? KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_VIDEOS
              : null,
            'videoIds',
          ]
        : [null, null];

    if (!kafkaTopic) return;
    if (mediaIds.length) {
      this._clientKafka.emit(kafkaTopic, {
        key: null,
        value: JSON.stringify({ [keyIds]: mediaIds, userId }),
      });
    }
  }

  public emitMediaToUploadServiceFromMediaList(
    mediaList: IMedia[],
    mediaMarkAction: MediaMarkAction,
    userId?: string
  ): void {
    const mediaIdsByType: {
      [MediaType.FILE]: string[];
      [MediaType.VIDEO]: string[];
    } = mediaList.reduce(
      (object, current) => {
        if (current.type === MediaType.FILE) object[MediaType.FILE].push(current.id);
        if (current.type === MediaType.VIDEO) object[MediaType.VIDEO].push(current.id);
        return object;
      },
      {
        [MediaType.FILE]: [],
        [MediaType.VIDEO]: [],
      }
    );
    Object.entries(mediaIdsByType).forEach(([mediaType, ids]) =>
      this.emitMediaToUploadService(mediaType as MediaType, mediaMarkAction, ids, userId)
    );
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  public async deleteUnusedMediav2(): Promise<void> {
    const unusedMediaList = await this._mediaModel.findAll({
      attributes: ['id', 'type', 'url'],
      include: [
        {
          model: PostMediaModel,
          attributes: [],
          required: false,
        },
        {
          model: CommentMediaModel,
          attributes: [],
          required: false,
        },
        {
          model: PostModel,
          attributes: [],
          required: false,
          paranoid: false,
        },
      ],
      where: {
        type: [MediaType.FILE, MediaType.VIDEO],
        createdAt: {
          [Op.lte]: moment().subtract(4, 'hours').toDate(),
        },
        [Op.and]: this._sequelizeConnection.literal(
          'post_id is null and comment_id is null and cover is null'
        ),
      },
    });

    this.emitMediaToUploadServiceFromMediaList(unusedMediaList, MediaMarkAction.DELETE);
    const deleteMediaIds = unusedMediaList.map((media) => media.id);
    await this.deleteMediaByIds(deleteMediaIds);
  }

  public async deleteMediaByIds(ids: string[]): Promise<void> {
    this._mediaModel.destroy({
      where: {
        id: ids,
      },
    });
  }

  public async processVideo(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      this._clientKafka.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: JSON.stringify({ videoIds: ids }),
      });
      await this.updateData(ids, { status: MediaStatus.PROCESSING });
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    }
  }

  public async getMediaByPostId(id: string): Promise<IMedia[]> {
    return this._mediaModel.findAll({
      include: [
        {
          model: PostMediaModel,
          attributes: [],
          required: true,
          where: {
            postId: id,
          },
        },
      ],
    });
  }
}
