import { Inject } from '@nestjs/common';

import { KAFKA_TOPIC } from '../../../../common/constants';
import { TargetType, VerbActivity } from '../../data-type';
import { ReactionEvent, ReactionEventData } from '../../domain/event';
import { REACTION_HAS_BEEN_CREATED, REACTION_HAS_BEEN_REMOVED } from '../../domain/event/constant';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';

import { IReactionEventApplicationService, ReactionEventPayload } from './interface';

export class ReactionEventApplicationService implements IReactionEventApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async emitReactionToCommentEvent(payload: ReactionEventPayload): Promise<void> {
    const { action, reaction, recipients } = payload;

    const event = new ReactionEvent({
      rooms: recipients,
      data: new ReactionEventData({
        event: action === 'create' ? REACTION_HAS_BEEN_CREATED : REACTION_HAS_BEEN_REMOVED,
        target: TargetType.CHILD_COMMENT,
        verb: VerbActivity.REACT,
        extra: { ...reaction },
      }),
    });

    await this._kafkaAdapter.emit<ReactionEvent>(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }

  public async emitReactionToChildCommenEvent(payload: ReactionEventPayload): Promise<void> {
    const { action, reaction, recipients } = payload;

    const event = new ReactionEvent({
      rooms: recipients,
      data: new ReactionEventData({
        event: action === 'create' ? REACTION_HAS_BEEN_CREATED : REACTION_HAS_BEEN_REMOVED,
        target: TargetType.CHILD_COMMENT,
        verb: VerbActivity.REACT,
        extra: { ...reaction },
      }),
    });

    await this._kafkaAdapter.emit<ReactionEvent>(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }

  public async emitReactionToContentEvent(payload: ReactionEventPayload): Promise<void> {
    const { action, reaction, recipients } = payload;

    const event = new ReactionEvent({
      rooms: recipients,
      data: new ReactionEventData({
        event: action === 'create' ? REACTION_HAS_BEEN_CREATED : REACTION_HAS_BEEN_REMOVED,
        target: reaction.contentType as unknown as TargetType,
        verb: VerbActivity.REACT,
        extra: { ...reaction },
      }),
    });

    await this._kafkaAdapter.emit<ReactionEvent>(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }
}
