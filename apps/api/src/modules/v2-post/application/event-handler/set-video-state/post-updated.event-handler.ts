import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostUpdatedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { KAFKA_TOPIC } from '@libs/infra/kafka/kafka.constant';

@EventsHandlerAndLog(PostUpdatedEvent)
export class VideoPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { postEntity, actor } = event.payload;

    if (postEntity.isPublished()) {
      const { attachVideoIds, detachVideoIds } = postEntity.getState();

      if (attachVideoIds.length) {
        await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.MARK_VIDEO_HAS_BEEN_USED, {
          key: null,
          value: { videoIds: attachVideoIds, userId: actor.id },
        });
      }

      if (detachVideoIds.length) {
        await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_VIDEOS, {
          key: null,
          value: { videoIds: detachVideoIds, userId: actor.id },
        });
      }
    }
  }
}
