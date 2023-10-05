import { ICommand } from '@nestjs/cqrs';

import { PostChangedMessagePayload } from '../../../dto/message';

export class ProcessPostUpdatedCommand implements ICommand {
  public constructor(public readonly payload: PostChangedMessagePayload) {}
}
