import { Span } from '@libs/common/modules/opentelemetry';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';
import { IQueueAdapter, QUEUE_ADAPTER } from '../../../domain/infra-adapter-interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';

import { ProducerFollowUnfollowGroupsCommand } from './producer-follow-unfollow-groups.command';

@CommandHandler(ProducerFollowUnfollowGroupsCommand)
export class ProducerFollowUnfollowGroupsHandler
  implements ICommandHandler<ProducerFollowUnfollowGroupsCommand, void>
{
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  @Span()
  public async execute(command: ProducerFollowUnfollowGroupsCommand): Promise<void> {
    const { groupIds, userId, action } = command.payload;

    switch (action) {
      case FollowAction.FOLLOW:
        await this._producerFollowGroupsJobs(groupIds, userId);
        return;
      case FollowAction.UNFOLLOW:
        await this._producerUnFollowGroupsJobs(groupIds, userId);
        return;
      default:
        return;
    }
  }

  private async _producerFollowGroupsJobs(groupIds: string[], userId: string): Promise<void> {
    const defaultLimit = 1000;
    const totalCount = await this._contentRepo.countNumberOfPostsPublishedInGroup({ groupIds });

    for (let page = 1; page <= Math.ceil(totalCount / defaultLimit); page++) {
      await this._queueAdapter.addFollowUnfollowGroupsJob({
        queryParams: {
          groupIds,
          offset: (page - 1) * defaultLimit,
          limit: defaultLimit,
        },
        userId,
        action: FollowAction.FOLLOW,
      });
    }
  }

  private async _producerUnFollowGroupsJobs(groupIds: string[], userId: string): Promise<void> {
    const defaultLimit = 1000;
    const notInGroupIds = await this._userAdapter.getGroupIdsJoinedByUserId(userId);
    const totalCount = await this._contentRepo.countNumberOfPostsPublishedInGroup({
      groupIds,
      notInGroupIds,
    });

    for (let page = 1; page <= Math.ceil(totalCount / defaultLimit); page++) {
      await this._queueAdapter.addFollowUnfollowGroupsJob({
        queryParams: {
          groupIds,
          notInGroupIds,
          offset: (page - 1) * defaultLimit,
          limit: defaultLimit,
        },
        userId,
        action: FollowAction.UNFOLLOW,
      });
    }
  }
}
