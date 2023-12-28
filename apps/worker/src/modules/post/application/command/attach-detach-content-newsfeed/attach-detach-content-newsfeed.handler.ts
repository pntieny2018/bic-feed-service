import { Span } from '@libs/common/modules/opentelemetry';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NewsfeedAction } from '../../../data-type';
import {
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '../../../domain/repositoty-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../domain/service-adapter-interface';

import { AttachDetachContentNewsfeedCommand } from './attach-detach-content-newsfeed.command';

@CommandHandler(AttachDetachContentNewsfeedCommand)
export class AttachDetachContentNewsfeedHandler
  implements ICommandHandler<AttachDetachContentNewsfeedCommand, void>
{
  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  @Span()
  public async execute(command: AttachDetachContentNewsfeedCommand): Promise<void> {
    const { content, action, queryParams } = command.payload;
    const { list: userIds } = await this._groupAdapter.getGroupsMembers(queryParams);

    if (!userIds.length) {
      return;
    }

    switch (action) {
      case NewsfeedAction.PUBLISH:
        await this._userNewsfeedRepo.attachContentToUserIds(content, userIds);
        return;
      case NewsfeedAction.REMOVE:
        await this._userNewsfeedRepo.detachContentIdFromUserIds(content.id, userIds);
        return;
      default:
        return;
    }
  }
}