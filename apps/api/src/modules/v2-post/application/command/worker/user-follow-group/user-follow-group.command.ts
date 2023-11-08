import { ICommand } from '@nestjs/cqrs';

export type UserFollowGroupPayload = {
  userId: string;
  groupIds: string[];
};
export class UserFollowGroupCommand implements ICommand {
  public constructor(public readonly payload: UserFollowGroupPayload) {}
}
