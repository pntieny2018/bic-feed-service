import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';
import { ReactionEvent, ReactionEventData } from '../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';

import {
  IReactionEventApplicationService,
  ReactionToCommentEventPayload,
  ReactionToContentEventPayload,
} from './interface';

export class ReactionEventApplicationService implements IReactionEventApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async emitReactionToCommentEvent(payload: ReactionToCommentEventPayload): Promise<void> {
    const {
      event: eventName,
      contentId,
      contentType,
      commentId,
      parentId,
      reaction,
      recipients,
    } = payload;

    const event = new ReactionEvent({
      rooms: recipients,
      data: new ReactionEventData({
        event: eventName,
        target: WS_TARGET_TYPE.COMMENT,
        verb: WS_ACTIVITY_VERB.REACT,
        extra: { contentId, contentType, commentId, parentId, reaction },
      }),
    });

    await this._kafkaAdapter.emit<ReactionEvent>(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }

  public async emitReactionToPostEvent(payload: ReactionToContentEventPayload): Promise<void> {
    const { event: eventName, contentId, contentType, reaction, recipients } = payload;

    const event = new ReactionEvent({
      rooms: recipients,
      data: new ReactionEventData({
        event: eventName,
        target: WS_TARGET_TYPE.POST,
        verb: WS_ACTIVITY_VERB.REACT,
        extra: { contentId, contentType, reaction },
      }),
    });

    await this._kafkaAdapter.emit<ReactionEvent>(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }

  public async emitReactionToArticleEvent(payload: ReactionToContentEventPayload): Promise<void> {
    const { event: eventName, contentId, contentType, reaction, recipients } = payload;

    const event = new ReactionEvent({
      rooms: recipients,
      data: new ReactionEventData({
        event: eventName,
        target: WS_TARGET_TYPE.ARTICLE,
        verb: WS_ACTIVITY_VERB.REACT,
        extra: { contentId, contentType, reaction },
      }),
    });

    await this._kafkaAdapter.emit<ReactionEvent>(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }
}
