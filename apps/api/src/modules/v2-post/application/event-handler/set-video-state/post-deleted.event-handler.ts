import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { PostDeletedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(PostDeletedEvent)
export class VideoPostDeletedEventHandler implements IEventHandler<PostDeletedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: PostDeletedEvent): Promise<void> {
    const { entity: postEntity, authUser } = event.payload;

    const videoIds = postEntity.get('media').videos.map((video) => video.get('id'));

    await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_UPLOAD.JOB.DELETE_VIDEOS, {
      key: null,
      value: { videoIds, userId: authUser.id },
    });
  }
}
