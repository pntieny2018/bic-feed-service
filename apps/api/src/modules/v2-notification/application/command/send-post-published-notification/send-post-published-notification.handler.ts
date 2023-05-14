import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SendPostPublishedNotificationCommand } from './send-post-published-notification.command';

@CommandHandler(SendPostPublishedNotificationCommand)
export class SendPostPublishedNotificationHandler
  implements ICommandHandler<SendPostPublishedNotificationCommand, void>
{
  public constructor() {}

  public async execute(command: SendPostPublishedNotificationCommand): Promise<void> {
    // get payload
    // send to kafka
  }
}
