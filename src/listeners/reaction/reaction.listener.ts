import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { CreateReactionEvent } from '../../events/reaction';
import { CreateReactionEventPayload } from '../../events/reaction/payload';
import { NotificationService } from '../../notification';
import { NotificationPayloadDto } from '../../notification/dto/requests/notification-payload.dto';

@Injectable()
export class ReactionListener {
  private readonly _logger = new Logger(ReactionListener.name);

  public constructor(private readonly _notificationService: NotificationService) {}

  @On(CreateReactionEvent)
  public onCreatedReactionEvent(event: CreateReactionEvent): void {
    this._logger.log(event);

    const kafkaCreatedReactionMessage: NotificationPayloadDto<CreateReactionEventPayload> = {
      actor: event.payload.reaction.userSharedDto,
      data: event.payload,
    };

    this._notificationService.publishReactionNotification<CreateReactionEventPayload>(
      kafkaCreatedReactionMessage
    );
  }
}
