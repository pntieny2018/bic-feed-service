import { ICommand } from '@nestjs/cqrs';
import { PostChangedMessagePayload } from '../../dto/message/post-published.message-payload';

export class ProcessPostUpdatedCommand implements ICommand {
  public constructor(public readonly payload: PostChangedMessagePayload) {}
}
