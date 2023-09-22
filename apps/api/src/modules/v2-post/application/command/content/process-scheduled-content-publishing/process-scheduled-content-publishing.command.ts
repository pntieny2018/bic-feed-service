import { ICommand } from '@nestjs/cqrs';

export type ProcessScheduledContentPublishingCommandPayload = {
  id: string;
  actorId: string;
};

export class ProcessScheduledContentPublishingCommand implements ICommand {
  public constructor(public readonly payload: ProcessScheduledContentPublishingCommandPayload) {}
}
