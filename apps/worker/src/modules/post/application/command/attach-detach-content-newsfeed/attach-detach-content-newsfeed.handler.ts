import { ArrayHelper } from '@libs/common/helpers';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
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
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepo: IContentRepository,
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async execute(command: AttachDetachContentNewsfeedCommand): Promise<void> {
    const { contentId, oldGroupIds, newGroupIds, limit } = command.payload;

    const content = await this._contentRepo.findContentByIdInActiveGroup(contentId);
    if (!content || !Boolean(content.publishedAt) || content.isHidden) {
      return;
    }

    const attachedGroupIds = ArrayHelper.arrDifferenceElements(newGroupIds, oldGroupIds);
    const detachedGroupIds = ArrayHelper.arrDifferenceElements(oldGroupIds, newGroupIds);

    if (attachedGroupIds.length) {
      let cursorPagination = null;
      while (true) {
        const { list: userIds, cursor } = await this._groupAdapter.getUserIdsInGroups({
          groupIds: attachedGroupIds,
          notInGroupIds: oldGroupIds,
          limit,
          after: cursorPagination,
        });
        if (userIds.length) {
          await this._userNewsfeedRepo.attachContentIdToUserIds(contentId, userIds);
        }
        if (userIds.length === 0 || userIds.length < 1000) {
          break;
        }
        cursorPagination = cursor;
      }
    }

    if (detachedGroupIds.length) {
      let cursorPagination = null;
      while (true) {
        const { list: userIds, cursor } = await this._groupAdapter.getUserIdsInGroups({
          groupIds: detachedGroupIds,
          notInGroupIds: newGroupIds,
          after: cursorPagination,
          limit: 1000,
        });
        if (userIds.length) {
          await this._userNewsfeedRepo.detachContentIdFromUserIds(contentId, userIds);
        }
        if (userIds.length === 0 || userIds.length < 1000) {
          break;
        }
        cursorPagination = cursor;
      }
    }
  }
}
