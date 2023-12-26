import { QueueName } from '@libs/infra/v2-queue';
import { Inject } from '@nestjs/common';

import {
  PUBLISHER_APPLICATION_SERVICE,
  IPublisherApplicationService,
} from '../../../queue-publisher/application/interface';
import {
  AttachDetachNewsfeedJobPayload,
  ContentScheduledJobPayload,
  FollowUnfollowGroupsJobPayload,
  IQueueAdapter,
  ProducerFollowUnfollowJobPayload,
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

  public async addProducerFollowUnfollowJob(
    payload: ProducerFollowUnfollowJobPayload
  ): Promise<void> {
    const { userId } = payload;
    await this._publisherAppService.addJob<ProducerFollowUnfollowJobPayload>(
      QueueName.PRODUCER_FOLLOW_UNFOLLOW_GROUPS,
      {
        data: payload,
        opts: { group: { id: userId } },
      }
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

  public async addAttachDetachNewsfeedJob(payload: AttachDetachNewsfeedJobPayload): Promise<void> {
    const { content } = payload;
    await this._publisherAppService.addJob<AttachDetachNewsfeedJobPayload>(
      QueueName.ATTACH_DETACH_NEWSFEED,
      {
        data: payload,
        opts: { group: { id: content.id } },
      }
    );
  }
}
