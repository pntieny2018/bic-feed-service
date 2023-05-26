import { ICommand } from '@nestjs/cqrs';

export type CreateTagCommandPayload = {
  groupId: string;
  name: string;
  userId: string;
};
export class CreateTagCommand implements ICommand {
  public constructor(public readonly payload: CreateTagCommandPayload) {}
}
