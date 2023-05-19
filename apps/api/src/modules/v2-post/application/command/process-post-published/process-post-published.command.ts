import { ICommand } from '@nestjs/cqrs';
import { PostPublishedMessagePayload } from '../../dto/message/post-published.message-payload';

export class ProcessPostPublishedCommand implements ICommand {
  public constructor(public readonly payload: PostPublishedMessagePayload) {}
}
