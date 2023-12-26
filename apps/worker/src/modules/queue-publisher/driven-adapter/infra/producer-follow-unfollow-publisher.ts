import { IQueueService, PRODUCER_FOLLOW_UNFOLLOW_SERVICE_TOKEN } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { PRODUCER_FOLLOW_UNFOLLOW_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: PRODUCER_FOLLOW_UNFOLLOW_PUBLISHER_TOKEN })
export class ProducerFollowUnfollowPublisher extends BasePublisher {
  public constructor(
    @Inject(PRODUCER_FOLLOW_UNFOLLOW_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
