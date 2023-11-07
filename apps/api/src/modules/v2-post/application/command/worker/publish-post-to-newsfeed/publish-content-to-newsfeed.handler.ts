import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../../domain/repositoty-interface';
import { PublishContentToNewsfeedCommand } from './publish-content-to-newsfeed.command';

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
    //TODO: ranking & update cache

    const { contentId, userId } = command.payload;

    const content = await this._contentRepo.findContentByIdInActiveGroup(contentId);
    if (!content) {
      return;
    }

    if (!content.isPublished() || content.isHidden()) {
      return;
    }
    await this._userNewsfeedRepo.attachContentIdToUserId(contentId, userId);
  }
}