import { ICommand } from '@nestjs/cqrs';

export type CreateDraftPostCommandPayload = {
  groupIds: string[];
  userId: string;
};
export class CreateDraftPostCommand implements ICommand {
  public constructor(public readonly payload: CreateDraftPostCommandPayload) {}
}
