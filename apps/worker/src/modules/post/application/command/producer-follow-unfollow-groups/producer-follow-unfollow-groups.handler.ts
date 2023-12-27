import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';
import {
  FollowUnfollowGroupsJobPayload,
  IQueueAdapter,
  QUEUE_ADAPTER,
} from '../../../domain/infra-adapter-interface';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';

import { ProducerFollowUnfollowGroupsCommand } from './producer-follow-unfollow-groups.command';

@CommandHandler(ProducerFollowUnfollowGroupsCommand)
export class ProducerFollowUnfollowGroupsHandler
  implements ICommandHandler<ProducerFollowUnfollowGroupsCommand, void>
{
  private readonly LIMIT_DEFAULT = 500;

  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

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
    const jobs: FollowUnfollowGroupsJobPayload[] = [];
    const totalCount = await this._contentRepo.countNumberOfPostsPublishedInGroup({ groupIds });

    for (let page = 1; page <= Math.ceil(totalCount / this.LIMIT_DEFAULT); page++) {
      jobs.push({
        queryParams: {
          groupIds,
          offset: (page - 1) * this.LIMIT_DEFAULT,
          limit: this.LIMIT_DEFAULT,
        },
        userId,
        action: FollowAction.FOLLOW,
      });
    }

    if (!jobs.length) {
      return;
    }

    await this._queueAdapter.addFollowUnfollowGroupsJobs(jobs);
  }

  private async _producerUnFollowGroupsJobs(groupIds: string[], userId: string): Promise<void> {
    const jobs: FollowUnfollowGroupsJobPayload[] = [];
    const notInGroupIds = await this._userAdapter.getGroupIdsJoinedByUserId(userId);
    const totalCount = await this._contentRepo.countNumberOfPostsPublishedInGroup({
      groupIds,
      notInGroupIds,
    });

    for (let page = 1; page <= Math.ceil(totalCount / this.LIMIT_DEFAULT); page++) {
      jobs.push({
        queryParams: {
          groupIds,
          notInGroupIds,
          offset: (page - 1) * this.LIMIT_DEFAULT,
          limit: this.LIMIT_DEFAULT,
        },
        userId,
        action: FollowAction.UNFOLLOW,
      });
    }

    if (!jobs.length) {
      return;
    }

    await this._queueAdapter.addFollowUnfollowGroupsJobs(jobs);
  }
}
