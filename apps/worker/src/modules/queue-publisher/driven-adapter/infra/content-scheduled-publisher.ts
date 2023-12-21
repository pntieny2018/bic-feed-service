import { CONTENT_SCHEDULED_SERVICE_TOKEN, IQueueService } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { CONTENT_SCHEDULED_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: CONTENT_SCHEDULED_PUBLISHER_TOKEN })
export class ContentScheduledPublisher extends BasePublisher {
  public constructor(
    @Inject(CONTENT_SCHEDULED_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
