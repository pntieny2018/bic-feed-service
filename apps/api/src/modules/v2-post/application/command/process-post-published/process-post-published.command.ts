import { ICommand } from '@nestjs/cqrs';
import { PostChangedMessagePayload } from '../../dto/message/post-published.message-payload';

export class ProcessPostPublishedCommand implements ICommand {
  public constructor(public readonly payload: PostChangedMessagePayload) {}
}
