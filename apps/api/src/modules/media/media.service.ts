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
import { UploadType } from '../upload/dto/requests/upload.dto';
import { MediaDto } from './dto';
import { MediaFilterResponseDto } from './dto/response';
import { FileMetadataResponseDto } from './dto/response/file-metadata-response.dto';
import { ImageMetadataResponseDto } from './dto/response/image-metadata-response.dto';
import { VideoMetadataResponseDto } from './dto/response/video-metadata-response.dto';
import { EntityType } from './media.constants';
import { UserDto } from '../v2-user/application';

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

  public async emitMediaToUploadService(
    mediaType: MediaType,
    mediaMarkAction: MediaMarkAction,
    mediaIds: string[],
    userId: string = null
  ): Promise<void> {
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
      await this._clientKafka.emit(kafkaTopic, {
        key: null,
        value: JSON.stringify({ [keyIds]: mediaIds, userId }),
      });
    }
  }

  public async processVideo(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    try {
      this._clientKafka.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: JSON.stringify({ videoIds: ids }),
      });
    } catch (e) {
      this._logger.error(JSON.stringify(e?.stack));
      this._sentryService.captureException(e);
    }
  }
}
