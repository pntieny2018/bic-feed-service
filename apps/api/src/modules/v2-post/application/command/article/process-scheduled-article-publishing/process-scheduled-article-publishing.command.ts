import { UserDto } from '@libs/service/user';
import { ICommand } from '@nestjs/cqrs';

export type ProcessScheduledArticlePublishingCommandPayload = {
  id: string;
  actor: UserDto;
};

export class ProcessScheduledArticlePublishingCommand implements ICommand {
  public constructor(public readonly payload: ProcessScheduledArticlePublishingCommandPayload) {}
}
