import { ICommand } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';

export type ProducerFollowUnfollowGroupsPaylod = {
  groupIds: string[];
  userId: string;
  action: FollowAction;
};

export class ProducerFollowUnfollowGroupsCommand implements ICommand {
  public constructor(public readonly payload: ProducerFollowUnfollowGroupsPaylod) {}
}
