import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostUpdatedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(PostUpdatedEvent)
export class VideoPostUpdatedEventHandler implements IEventHandler<PostUpdatedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostUpdatedEvent): Promise<void> {
    const { entity: postEntity, authUser } = event.payload;

    if (postEntity.isPublished()) {
      const { detachVideoIds } = postEntity.getState();

      if (detachVideoIds.length) {
        await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_VIDEOS, {
          key: null,
          value: { videoIds: detachVideoIds, userId: authUser.id },
        });
      }
    }
  }
}
