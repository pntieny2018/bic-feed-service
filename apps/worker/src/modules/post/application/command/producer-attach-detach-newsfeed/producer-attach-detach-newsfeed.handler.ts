import { ArrayHelper } from '@libs/common/helpers';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NewsfeedAction } from '../../../data-type';
import {
  AttachDetachNewsfeedJobPayload,
  IQueueAdapter,
  QUEUE_ADAPTER,
} from '../../../domain/infra-adapter-interface';
import { GROUP_ADAPTER, IGroupAdapter } from '../../../domain/service-adapter-interface';

import { ProducerAttachDetachNewsfeedCommand } from './producer-attach-detach-newsfeed.command';

@CommandHandler(ProducerAttachDetachNewsfeedCommand)
export class ProducerAttachDetachNewsfeedHandler
  implements ICommandHandler<ProducerAttachDetachNewsfeedCommand, void>
{
  private readonly LIMIT_DEFAULT = 1000;

  public constructor(
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(QUEUE_ADAPTER)
    private readonly _queueAdapter: IQueueAdapter
  ) {}

  public async execute(command: ProducerAttachDetachNewsfeedCommand): Promise<void> {
    const { content, oldGroupIds, newGroupIds } = command.payload;

    const jobs: AttachDetachNewsfeedJobPayload[] = [];
    const attachedGroupIds = ArrayHelper.arrDifferenceElements(newGroupIds, oldGroupIds);
    const detachedGroupIds = ArrayHelper.arrDifferenceElements(oldGroupIds, newGroupIds);

    if (attachedGroupIds.length) {
      const { total: totalAttached } = await this._groupAdapter.countUsersInGroups({
        groupIds: attachedGroupIds,
        notInGroupIds: oldGroupIds,
      });

      for (let page = 1; page <= Math.ceil(totalAttached / this.LIMIT_DEFAULT); page++) {
        jobs.push({
          queryParams: {
            groupIds: attachedGroupIds,
            notInGroupIds: oldGroupIds,
            offset: (page - 1) * this.LIMIT_DEFAULT,
            limit: this.LIMIT_DEFAULT,
          },
          content,
          action: NewsfeedAction.PUBLISH,
        });
      }
    }

    if (detachedGroupIds.length) {
      const { total: totalDetached } = await this._groupAdapter.countUsersInGroups({
        groupIds: detachedGroupIds,
        notInGroupIds: newGroupIds,
      });

      for (let page = 1; page <= Math.ceil(totalDetached / this.LIMIT_DEFAULT); page++) {
        jobs.push({
          queryParams: {
            groupIds: detachedGroupIds,
            notInGroupIds: newGroupIds,
            offset: (page - 1) * this.LIMIT_DEFAULT,
            limit: this.LIMIT_DEFAULT,
          },
          content,
          action: NewsfeedAction.REMOVE,
        });
      }
    }

    if (!jobs.length) {
      return;
    }

    await this._queueAdapter.addAttachDetachNewsfeedJobs(jobs);
  }
}
