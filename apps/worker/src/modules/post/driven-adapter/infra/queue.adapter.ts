import { QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';

import {
  PUBLISHER_APPLICATION_SERVICE,
  IPublisherApplicationService,
} from '../../../queue-publisher/application/interface';
import {
  ContentScheduledJobPayload,
  FollowUnfollowGroupsJobPayload,
  IQueueAdapter,
} from '../../domain/infra-adapter-interface';

export class QueueAdapter implements IQueueAdapter {
  public constructor(
    @Inject(PUBLISHER_APPLICATION_SERVICE)
    private readonly _publisherAppService: IPublisherApplicationService
  ) {}

  public async addContentScheduledJobs(payloads: ContentScheduledJobPayload[]): Promise<void> {
    await this._publisherAppService.addBulkJobs<ContentScheduledJobPayload>(
      QueueName.CONTENT_SCHEDULED,
      payloads.map(({ contentId, ownerId }) => ({
        data: { contentId, ownerId },
        opts: { jobId: contentId },
      }))
    );
  }

  public async addFollowUnfollowGroupsJob(payload: FollowUnfollowGroupsJobPayload): Promise<void> {
    const { userId } = payload;
    await this._publisherAppService.addJob<FollowUnfollowGroupsJobPayload>(
      QueueName.FOLLOW_UNFOLLOW_GROUPS,
      {
        data: payload,
        opts: { group: { id: userId } },
      }
    );
  }
}
