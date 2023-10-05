import { ICommand } from '@nestjs/cqrs';

import { PostChangedMessagePayload } from '../../../dto/message';

export class ProcessPostPublishedCommand implements ICommand {
  public constructor(public readonly payload: PostChangedMessagePayload) {}
}
