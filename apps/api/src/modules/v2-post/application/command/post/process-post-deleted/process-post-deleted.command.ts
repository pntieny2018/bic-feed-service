import { ICommand } from '@nestjs/cqrs';

import { PostChangedMessagePayload } from '../../../dto/message';

export class ProcessPostDeletedCommand implements ICommand {
  public constructor(public readonly payload: PostChangedMessagePayload) {}
}
