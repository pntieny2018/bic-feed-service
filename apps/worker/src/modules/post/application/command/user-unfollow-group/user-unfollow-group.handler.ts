import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';
import { FOLLOW_REPOSITORY_TOKEN, IFollowRepository } from '../../../domain/repositoty-interface';

import { UserUnfollowGroupCommand } from './user-unfollow-group.command';

@CommandHandler(UserUnfollowGroupCommand)
export class UserUnfollowGroupHandler implements ICommandHandler<UserUnfollowGroupCommand, void> {
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly _followRepo: IFollowRepository
  ) {}

  public async execute(command: UserUnfollowGroupCommand): Promise<void> {
    const { userId, groupIds } = command.payload;

    await this._queueAdapter.addFollowUnfollowGroupsJob({
      userId,
      groupIds,
      action: FollowAction.UNFOLLOW,
    });

    await this._followRepo.deleteByUserIdAndGroupIds(userId, groupIds);
  }
}
