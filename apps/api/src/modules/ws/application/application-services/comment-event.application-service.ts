import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { TargetType, VerbActivity } from '../../data-type';
import { CommentCreatedEvent, CommentCreatedEventData } from '../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';

import { ICommentEventApplicationService, CommentCreatedEventPayload } from './interface';

export class CommentEventApplicationService implements ICommentEventApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async emitCommentCreatedEvent(payload: CommentCreatedEventPayload): Promise<void> {
    const { event: eventName, recipients, contentId, contentType, comment } = payload;

    const event = new CommentCreatedEvent({
      rooms: recipients,
      data: new CommentCreatedEventData({
        event: eventName,
        verb: VerbActivity.POST,
        target: TargetType.POST,
        extra: {
          contentId,
          contentType,
          comment,
        },
      }),
    });

    await this._kafkaAdapter.emit<CommentCreatedEvent>(
      KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT,
      event
    );
  }
}
