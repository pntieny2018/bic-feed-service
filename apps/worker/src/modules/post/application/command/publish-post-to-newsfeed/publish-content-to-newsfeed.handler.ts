import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';

import { PublishContentToNewsfeedCommand } from './publish-content-to-newsfeed.command';

/**
 * Keep this file to backward compatible
 * TODO: Remove soon
 */
@CommandHandler(PublishContentToNewsfeedCommand)
export class PublishContentToNewsfeedHandler
  implements ICommandHandler<PublishContentToNewsfeedCommand, void>
{
  public constructor(
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository,

    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository
  ) {}

  public async execute(command: PublishContentToNewsfeedCommand): Promise<void> {
    const { contentId, userId } = command.payload;

    const content = await this._contentRepo.findContentByIdInActiveGroup(contentId);
    if (!content || !Boolean(content.publishedAt) || content.isHidden) {
      return;
    }

    //TODO: ranking & update cache
    await this._userNewsfeedRepo.attachContentIdToUserId(contentId, userId);
  }
}
