import { ICommand } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';

export type DispatchFollowUnfollowGroupsPayload = {
  groupIds: string[];
  userId: string;
  action: FollowAction;
};

export class DispatchFollowUnfollowGroupsCommand implements ICommand {
  public constructor(public readonly payload: DispatchFollowUnfollowGroupsPayload) {}
}
