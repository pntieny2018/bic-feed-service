import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { TargetType, VerbActivity } from '../../data-type';
import { PostVideoProcessedEvent, PostVideoProcessedEventData } from '../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';

import { IPostEventApplicationService, PostVideoProcessedEventPayload } from './interface';

export class PostEventApplicationService implements IPostEventApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async emitPostVideoProcessedEvent(payload: PostVideoProcessedEventPayload): Promise<void> {
    const { event: eventName, postId, status, recipients } = payload;

    const event = new PostVideoProcessedEvent({
      rooms: recipients,
      data: new PostVideoProcessedEventData({
        event: eventName,
        verb: VerbActivity.POST,
        target: TargetType.POST,
        extra: {
          postId,
          status,
        },
      }),
    });

    await this._kafkaAdapter.emit<PostVideoProcessedEvent>(
      KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT,
      event
    );
  }
}
