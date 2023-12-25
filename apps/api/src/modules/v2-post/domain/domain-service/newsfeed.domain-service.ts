import { ArrayHelper } from '@libs/common/helpers';
import { CursorPaginationResult } from '@libs/database/postgres/common';
import { Inject } from '@nestjs/common';

import { IQueueAdapter, QUEUE_ADAPTER } from '../infra-adapter-interface';
import { ContentEntity } from '../model/content';
import { IUserNewsfeedRepository, USER_NEWSFEED_REPOSITORY_TOKEN } from '../repositoty-interface';

import {
  DispatchContentIdToGroupsProps,
  GetContentIdsInNewsFeedProps,
  INewsfeedDomainService,
} from './interface';

export class NewsfeedDomainService implements INewsfeedDomainService {
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter,
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async dispatchContentIdToGroups(input: DispatchContentIdToGroupsProps): Promise<void> {
    const { contentId, newGroupIds, oldGroupIds } = input;

    const attachedGroupIds = ArrayHelper.arrDifferenceElements(newGroupIds, oldGroupIds);
    const detachedGroupIds = ArrayHelper.arrDifferenceElements(oldGroupIds, newGroupIds);

    if (!attachedGroupIds.length && !detachedGroupIds.length) {
      return;
    }

    await this._queueAdapter.addProducerAttachDetachNewsfeedJob({
      contentId,
      newGroupIds,
      oldGroupIds,
    });
  }

  public async attachContentToUserId(contentEntity: ContentEntity, userId: string): Promise<void> {
    return this._userNewsfeedRepo.attachContentToUserId(contentEntity, userId);
  }

  public async getContentIdsInNewsFeed(
    props: GetContentIdsInNewsFeedProps
  ): Promise<CursorPaginationResult<string>> {
    const { isMine, type, isSaved, limit, isImportant, after, authUserId } = props;

    if (isImportant) {
      const { rows, meta } =
        await this._userNewsfeedRepo.getImportantContentIdsCursorPaginationByUserId({
          userId: authUserId,
          type,
          limit,
          after,
        });
      return {
        rows,
        meta,
      };
    }
    const { rows, meta } = await this._userNewsfeedRepo.getContentIdsCursorPaginationByUserId({
      userId: authUserId,
      isSavedBy: isSaved ? authUserId : null,
      createdBy: isMine ? authUserId : null,
      type,
      limit,
      after,
    });

    return {
      rows,
      meta,
    };
  }
}
