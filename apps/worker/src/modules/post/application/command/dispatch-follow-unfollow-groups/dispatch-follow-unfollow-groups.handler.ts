import { Span } from '@libs/common/modules/opentelemetry';
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

  @Span()
  public async execute(command: DispatchFollowUnfollowGroupsCommand): Promise<void> {
    const { queryParams, userId, action } = command.payload;
    const contents = await this._contentRepo.getPaginationPostIdsPublishedInGroup(queryParams);

    if (!contents.length) {
      return;
    }

    switch (action) {
      case FollowAction.FOLLOW:
        await this._userNewsfeedRepo.attachContentsToUserId(contents, userId);
        return;
      case FollowAction.UNFOLLOW:
        const contentIds = contents.map((content) => content.id);
        await this._userNewsfeedRepo.detachContentIdsFromUserId(contentIds, userId);
        return;
      default:
        return;
    }
  }
}
