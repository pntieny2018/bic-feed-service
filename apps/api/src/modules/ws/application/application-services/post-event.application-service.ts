import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { Inject } from '@nestjs/common';

import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';
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
      key: postId,
      value: {
        rooms: recipients,
        data: new PostVideoProcessedEventData({
          event: eventName,
          verb: WS_ACTIVITY_VERB.POST,
          target: WS_TARGET_TYPE.POST,
          extra: {
            postId,
            status,
          },
        }),
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }
}
