import { ICommand } from '@nestjs/cqrs';

export type CreatePostCommandPayload = {
  groupIds: string;
  userId: string;
};

export class CreatePostCommand implements ICommand {
  public constructor(public readonly payload: CreatePostCommandPayload) {}
}
