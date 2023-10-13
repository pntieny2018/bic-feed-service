import { MEDIA_TYPE } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { InternalEventEmitterService } from 'apps/api/src/app/custom/event-emitter';

import { KAFKA_TOPIC } from '../../../../../common/constants';
import { SeriesAddedItemsEvent } from '../../../../../events/series';
import {
  IMediaDomainService,
  MEDIA_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { PostPublishedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { PostEntity } from '../../../domain/model/content';

@EventsHandlerAndLog(PostPublishedEvent)
export class PostPublishedEventHandler implements IEventHandler<PostPublishedEvent> {
  public constructor(
    @Inject(MEDIA_DOMAIN_SERVICE_TOKEN)
    private readonly _mediaDomainService: IMediaDomainService,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter,
    // TODO: call domain and using event bus
    private readonly _internalEventEmitter: InternalEventEmitterService
  ) {}

  public async handle(event: PostPublishedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isPublished()) {
      await this._processMedia(postEntity);
      await this._processSeriesItemsChanged(postEntity, actor);
    }

    if (postEntity.isProcessing() && postEntity.getVideoIdProcessing()) {
      this._kafkaAdapter.emit(KAFKA_TOPIC.STREAM.VIDEO_POST_PUBLIC, {
        key: null,
        value: { videoIds: [postEntity.getVideoIdProcessing()] },
      });
    }
  }

  private async _processMedia(postEntity: PostEntity): Promise<void> {
    const videoIds = postEntity.get('media').videos.map((video) => video.get('id'));
    const fileIds = postEntity.get('media').files.map((file) => file.get('id'));
    if (videoIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MEDIA_TYPE.VIDEO,
        videoIds,
        postEntity.get('createdBy')
      );
    }
    if (fileIds.length) {
      await this._mediaDomainService.setMediaUsed(
        MEDIA_TYPE.FILE,
        fileIds,
        postEntity.get('createdBy')
      );
    }
  }

  private async _processSeriesItemsChanged(postEntity: PostEntity, actor: UserDto): Promise<void> {
    const seriesIds = postEntity.getSeriesIds() || [];
    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesAddedItemsEvent({
          itemIds: [postEntity.getId()],
          seriesId,
          actor: actor,
          context: 'publish',
        })
      );
    }
  }
}
