import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

import { RemoveContentFromNewsfeedCommand } from './remove-content-from-newsfeed.command';

/**
 * Keep this file to backward compatible
 * TODO: Remove soon
 */
@CommandHandler(RemoveContentFromNewsfeedCommand)
export class RemoveContentFromNewsfeedHandler
  implements ICommandHandler<RemoveContentFromNewsfeedCommand, void>
{
  public constructor(
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async execute(command: RemoveContentFromNewsfeedCommand): Promise<void> {
    const { contentId, userId } = command.payload;

    //TODO: ranking & update cache
    await this._userNewsfeedRepo.detachContentIdFromUserId(contentId, userId);
  }
}
