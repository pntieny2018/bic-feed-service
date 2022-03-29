import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { CreatedReactionEvent } from '../../events/reaction';
import { CreatedReactionEventPayload } from '../../events/reaction/payload';
import { NotificationService } from '../../notification';
import { NotificationPayloadDto } from '../../notification/dto/requests/notification-payload.dto';

@Injectable()
export class ReactionListener {
  private readonly _logger = new Logger(ReactionListener.name);

  public constructor(private readonly _notificationService: NotificationService) {}

  @On(CreatedReactionEvent)
  public onCreatedReactionEvent(event: CreatedReactionEvent): void {
    this._logger.log(event);

    const kafkaCreatedReactionMessage: NotificationPayloadDto<CreatedReactionEventPayload> = {
      actor: event.payload.reaction.userId,
      data: event.payload,
    };

    this._notificationService.publishReactionNotification<CreatedReactionEventPayload>(
      kafkaCreatedReactionMessage
    );
  }
}
