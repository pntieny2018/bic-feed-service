import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { RemoveContentToNewsfeedCommand } from './remove-content-to-newsfeed.command';

@CommandHandler(RemoveContentToNewsfeedCommand)
export class RemoveContentToNewsfeedHandler
  implements ICommandHandler<RemoveContentToNewsfeedCommand, void>
{
  public constructor(
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async execute(command: RemoveContentToNewsfeedCommand): Promise<void> {
    //TODO: ranking & update cache

    const { contentId, userId } = command.payload;

    await this._userNewsfeedRepo.detachContentIdFromUserId(contentId, userId);
  }
}
