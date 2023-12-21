import { FOLLOW_UNFOLLOW_GROUPS_SERVICE_TOKEN, IQueueService } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { FOLLOW_UNFOLLOW_GROUPS_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: FOLLOW_UNFOLLOW_GROUPS_PUBLISHER_TOKEN })
export class FollowUnfollowGroupsPublisher extends BasePublisher {
  public constructor(
    @Inject(FOLLOW_UNFOLLOW_GROUPS_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
