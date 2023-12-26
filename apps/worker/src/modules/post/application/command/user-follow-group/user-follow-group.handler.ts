import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';
import { FOLLOW_REPOSITORY_TOKEN, IFollowRepository } from '../../../domain/repositoty-interface';

import { UserFollowGroupCommand } from './user-follow-group.command';

@CommandHandler(UserFollowGroupCommand)
export class UserFollowGroupHandler implements ICommandHandler<UserFollowGroupCommand, void> {
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    @Inject(FOLLOW_REPOSITORY_TOKEN)
    private readonly _followRepo: IFollowRepository
  ) {}

  public async execute(command: UserFollowGroupCommand): Promise<void> {
    const { userId, groupIds } = command.payload;
    if (groupIds.length === 0) {
      return;
    }

    await this._queueAdapter.addProducerFollowUnfollowJob({
      userId,
      groupIds,
      action: FollowAction.FOLLOW,
    });

    await this._followRepo.bulkCreate(groupIds.map((groupId) => ({ userId, groupId })));
  }
}
