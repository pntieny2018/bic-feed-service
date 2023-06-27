import { ICommand } from '@nestjs/cqrs';

export type CreateTagCommandPayload = {
  groupId: string;
  name: string;
  userId: string;
};
export class CreateQuizCommand implements ICommand {
  public constructor(public readonly payload: CreateTagCommandPayload) {}
}
