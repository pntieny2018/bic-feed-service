import { ICommand } from '@nestjs/cqrs';

import { PostVideoProcessedMessagePayload } from '../../../dto/message';

export class PostVideoSuccessCommand implements ICommand {
  public constructor(public readonly payload: PostVideoProcessedMessagePayload) {}
}
