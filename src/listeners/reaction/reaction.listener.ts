import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { CreateReactionInternalEvent, DeleteReactionInternalEvent } from '../../events/reaction';
import { ReactionEventPayload } from '../../events/reaction/payload';
import { NotificationService } from '../../notification';
import { NotificationPayloadDto } from '../../notification/dto/requests/notification-payload.dto';

@Injectable()
export class ReactionListener {
  private readonly _logger = new Logger(ReactionListener.name);

  public constructor(private readonly _notificationService: NotificationService) {}

  @On(CreateReactionInternalEvent)
  public onCreatedReactionEvent(event: CreateReactionInternalEvent): void {
    this._logger.debug(`[onCreatedReactionEvent]: ${JSON.stringify(event)}`);

    const createReactionEventPayload: ReactionEventPayload = {
      reaction: event.payload.reaction,
      post: event.payload.post,
      comment: event.payload.comment,
    };
    const kafkaCreateReactionMessage: NotificationPayloadDto<ReactionEventPayload> = {
      key: event.getEventName(),
      value: {
        actor: event.payload.userSharedDto,
        event: event.getEventName(),
        data: createReactionEventPayload,
      },
    };

    this._notificationService.publishReactionNotification<ReactionEventPayload>(
      kafkaCreateReactionMessage
    );
  }

  @On(DeleteReactionInternalEvent)
  public onDeleteReactionEvent(event: DeleteReactionInternalEvent): void {
    this._logger.debug(`[onDeleteReactionEvent]: ${JSON.stringify(event)}`);
    const deleteReactionEventPayload: ReactionEventPayload = {
      reaction: event.payload.reaction,
      post: event.payload.post,
      comment: event.payload.comment,
    };
    const kafkaDeleteReactionMessage: NotificationPayloadDto<ReactionEventPayload> = {
      key: event.getEventName(),
      value: {
        actor: event.payload.userSharedDto,
        event: event.getEventName(),
        data: deleteReactionEventPayload,
      },
    };
    this._notificationService.publishReactionNotification<ReactionEventPayload>(
      kafkaDeleteReactionMessage
    );
  }
}
