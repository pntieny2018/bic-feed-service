import { ICommand } from '@nestjs/cqrs';

export type ProcessScheduledArticlePublishingCommandPayload = {
  id: string;
  actorId: string;
};

export class ProcessScheduledArticlePublishingCommand implements ICommand {
  public constructor(public readonly payload: ProcessScheduledArticlePublishingCommandPayload) {}
}
