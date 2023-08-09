import { ICommand } from '@nestjs/cqrs';

export type ProcessArticleScheduledCommandPayload = {
  beforeDate: Date;
};

export class ProcessArticleScheduledCommand implements ICommand {
  public constructor(public readonly payload: ProcessArticleScheduledCommandPayload) {}
}
