import { ArrayHelper } from '@libs/common/helpers';
import { Inject } from '@nestjs/common';

import { IQueueAdapter, QUEUE_ADAPTER } from '../infra-adapter-interface';
import { IUserNewsfeedRepository, USER_NEWSFEED_REPOSITORY_TOKEN } from '../repositoty-interface';

import { DispatchContentIdToGroupsProps, INewsfeedDomainService } from './interface';

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

  public async attachContentIdToUserId(contentId: string, userId: string): Promise<void> {
    return this._userNewsfeedRepo.attachContentIdToUserId(contentId, userId);
  }
}
