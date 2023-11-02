import { ICommand } from '@nestjs/cqrs';

import { PostVideoProcessedMessagePayload } from '../../../dto/message';

export class PostVideoFailCommand implements ICommand {
  public constructor(public readonly payload: PostVideoProcessedMessagePayload) {}
}
