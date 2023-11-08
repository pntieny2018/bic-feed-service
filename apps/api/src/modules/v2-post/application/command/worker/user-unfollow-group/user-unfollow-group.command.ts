import { ICommand } from '@nestjs/cqrs';

export type UserUnfollowGroupsPayload = {
  userId: string;
  groupIds: string[];
};
export class UserUnfollowGroupCommand implements ICommand {
  public constructor(public readonly payload: UserUnfollowGroupsPayload) {}
}
