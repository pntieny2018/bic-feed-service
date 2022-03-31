import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { CreateReactionInternalEvent } from '../../events/reaction';
import { CreateReactionEventPayload } from '../../events/reaction/payload';
import { NotificationService } from '../../notification';
import { NotificationPayloadDto } from '../../notification/dto/requests/notification-payload.dto';

@Injectable()
export class ReactionListener {
  private readonly _logger = new Logger(ReactionListener.name);

  public constructor(private readonly _notificationService: NotificationService) {}

  @On(CreateReactionInternalEvent)
  public onCreatedReactionEvent(event: CreateReactionInternalEvent): void {
    this._logger.log(event);

    const kafkaCreatedReactionMessage: NotificationPayloadDto<CreateReactionEventPayload> = {
      actor: event.payload.userSharedDto,
      data: event.payload,
    };

    this._notificationService.publishReactionNotification<CreateReactionEventPayload>(
      kafkaCreatedReactionMessage
    );
  }
}
