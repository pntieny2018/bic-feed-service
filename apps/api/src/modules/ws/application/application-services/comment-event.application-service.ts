import { CONTENT_TYPE } from '@beincom/constants';
import { KAFKA_TOPIC } from '@libs/infra/kafka';
import { Inject } from '@nestjs/common';
import { NIL } from 'uuid';

import { WS_TARGET_TYPE, WS_ACTIVITY_VERB } from '../../data-type';
import { CommentCreatedEvent, CommentCreatedEventData } from '../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../domain/infra-adapter-interface';

import { ICommentEventApplicationService, CommentCreatedEventPayload } from './interface';

export class CommentEventApplicationService implements ICommentEventApplicationService {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async emitCommentCreatedEvent(payload: CommentCreatedEventPayload): Promise<void> {
    const {
      event: eventName,
      recipients,
      contentId,
      commentId,
      parentId,
      contentType,
      comment,
    } = payload;

    const event = new CommentCreatedEvent({
      key: contentId,
      value: {
        rooms: recipients,
        data: new CommentCreatedEventData({
          event: eventName,
          verb: WS_ACTIVITY_VERB.COMMENT,
          target: this._getTargetType(payload),
          extra: {
            contentId,
            contentType,
            comment,
            commentId,
            parentId,
          },
        }),
      },
    });

    await this._kafkaAdapter.emit(KAFKA_TOPIC.BEIN_NOTIFICATION.WS_EVENT, event);
  }

  private _getTargetType(payload: CommentCreatedEventPayload): WS_TARGET_TYPE {
    const { parentId, contentType } = payload;

    if (parentId !== NIL) {
      return WS_TARGET_TYPE.COMMENT;
    }

    if (contentType === CONTENT_TYPE.POST) {
      return WS_TARGET_TYPE.POST;
    } else {
      return WS_TARGET_TYPE.ARTICLE;
    }
  }
}
