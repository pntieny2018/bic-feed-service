import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

import { DispatchFollowUnfollowGroupsCommand } from './dispatch-follow-unfollow-groups.command';

@CommandHandler(DispatchFollowUnfollowGroupsCommand)
export class DispatchFollowUnfollowGroupsHandler
  implements ICommandHandler<DispatchFollowUnfollowGroupsCommand, void>
{
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async execute(command: DispatchFollowUnfollowGroupsCommand): Promise<void> {
    const { queryParams, userId, action } = command.payload;
    const contentIds = await this._contentRepo.getPaginationPostIdsPublishedInGroup(queryParams);

    if (!contentIds.length) {
      return;
    }

    switch (action) {
      case FollowAction.FOLLOW:
        await this._userNewsfeedRepo.attachContentIdsToUserId(contentIds, userId);
        return;
      case FollowAction.UNFOLLOW:
        await this._userNewsfeedRepo.detachContentIdsFromUserId(contentIds, userId);
        return;
      default:
        return;
    }
  }
}
