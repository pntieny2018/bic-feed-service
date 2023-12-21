import { Inject } from '@nestjs/common';

import { IQueueAdapter, QUEUE_ADAPTER } from '../infra-adapter-interface';

import { DispatchContentIdToGroupsProps, INewsfeedDomainService } from './interface';

export class NewsfeedDomainService implements INewsfeedDomainService {
  public constructor(
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async dispatchContentIdToGroups(input: DispatchContentIdToGroupsProps): Promise<void> {
    const { contentId, newGroupIds, oldGroupIds } = input;
    const defaultLimit = 1000;

    await this._queueAdapter.addPublishRemoveContentToNewsfeedJob({
      contentId,
      newGroupIds,
      oldGroupIds,
      limit: defaultLimit,
    });
  }
}
