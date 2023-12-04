import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { RemoveContentFromNewsfeedCommand } from './remove-content-from-newsfeed.command';
import { IUserAdapter, USER_ADAPTER } from '../../../../domain/service-adapter-interface';

@CommandHandler(RemoveContentFromNewsfeedCommand)
export class RemoveContentFromNewsfeedHandler
  implements ICommandHandler<RemoveContentFromNewsfeedCommand, void>
{
  public constructor(
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(USER_ADAPTER)
    private readonly _userAdapter: IUserAdapter
  ) {}

  public async execute(command: RemoveContentFromNewsfeedCommand): Promise<void> {
    const { contentId, userId } = command.payload;

    const groupIdsUserJoined = await this._userAdapter.getGroupIdsJoinedByUserId(userId);
    if (groupIdsUserJoined.length) {
      const contentHasBelongToGroupIds = await this._contentRepo.hasBelongActiveGroupIds(
        contentId,
        groupIdsUserJoined
      );
      if (contentHasBelongToGroupIds) {
        return;
      }
    }

    //TODO: ranking & update cache
    await this._userNewsfeedRepo.detachContentIdFromUserId(contentId, userId);
  }
}
