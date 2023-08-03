import { SentryService } from '@app/sentry';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_PRODUCER, KAFKA_TOPIC } from '../../common/constants';
import { MediaMarkAction, MediaType } from '../../database/models/media.model';

@Injectable()
export class MediaService {
  private _logger = new Logger(MediaService.name);
  public constructor(
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
