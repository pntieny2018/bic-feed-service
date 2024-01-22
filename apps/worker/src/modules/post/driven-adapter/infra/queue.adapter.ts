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

  public async addFollowUnfollowGroupsJobs(
    payloads: FollowUnfollowGroupsJobPayload[]
  ): Promise<void> {
    await this._publisherAppService.addBulkJobs<FollowUnfollowGroupsJobPayload>(
      QueueName.FOLLOW_UNFOLLOW_GROUPS,
      payloads.map((payload) => ({
        data: payload,
        opts: { group: { id: payload.userId } },
      }))
    );
  }

  public async addAttachDetachNewsfeedJobs(
    payloads: AttachDetachNewsfeedJobPayload[]
  ): Promise<void> {
    await this._publisherAppService.addBulkJobs<AttachDetachNewsfeedJobPayload>(
      QueueName.ATTACH_DETACH_NEWSFEED,
      payloads.map((payload) => ({
        data: payload,
        opts: { group: { id: payload.content.id } },
      }))
    );
  }
}
