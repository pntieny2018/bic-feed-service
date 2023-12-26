import { ATTACH_DETACH_NEWSFEED_SERVICE_TOKEN, IQueueService } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { ATTACH_DETACH_NEWSFEED_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: ATTACH_DETACH_NEWSFEED_PUBLISHER_TOKEN })
export class AttachDetachNewsfeedPublisher extends BasePublisher {
  public constructor(
    @Inject(ATTACH_DETACH_NEWSFEED_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
