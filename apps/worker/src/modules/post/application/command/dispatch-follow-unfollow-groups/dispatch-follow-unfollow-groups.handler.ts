import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { FollowAction } from '../../../data-type';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { IUserAdapter, USER_ADAPTER } from '../../../domain/service-adapter-interface';

import { DispatchFollowUnfollowGroupsCommand } from './dispatch-follow-unfollow-groups.command';

@CommandHandler(DispatchFollowUnfollowGroupsCommand)
export class DispatchFollowUnfollowGroupsHandler
  implements ICommandHandler<DispatchFollowUnfollowGroupsCommand, void>
{
  public constructor(
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async execute(command: DispatchFollowUnfollowGroupsCommand): Promise<void> {
    const { groupIds, userId, action } = command.payload;

    switch (action) {
      case FollowAction.FOLLOW:
        await this._attachContentInGroupsToUserId(groupIds, userId);
        return;
      case FollowAction.UNFOLLOW:
        await this._detachContentInGroupsToUserId(groupIds, userId);
        return;
      default:
        return;
    }
  }

  private async _attachContentInGroupsToUserId(groupIds: string[], userId: string): Promise<void> {
    let afterCursor = null;
    while (true) {
      const { ids, cursor } = await this._contentRepo.getCursorPaginationPostIdsPublishedInGroup({
        groupIds,
        limit: 1000,
        after: afterCursor,
      });
      if (!ids.length) {
        break;
      }
      await this._userNewsfeedRepo.attachContentIdsToUserId(ids, userId);
      afterCursor = cursor;
    }
  }

  private async _detachContentInGroupsToUserId(groupIds: string[], userId: string): Promise<void> {
    let afterCursor = null;
    const groupIdsUserJoined = await this._userAdapter.getGroupIdsJoinedByUserId(userId);
    while (true) {
      const { ids, cursor } = await this._contentRepo.getCursorPaginationPostIdsPublishedInGroup({
        groupIds,
        notInGroupIds: groupIdsUserJoined,
        limit: 1000,
        after: afterCursor,
      });
      if (!ids.length) {
        break;
      }
      await this._userNewsfeedRepo.detachContentIdsFromUserId(ids, userId);
      afterCursor = cursor;
    }
    return;
  }
}
