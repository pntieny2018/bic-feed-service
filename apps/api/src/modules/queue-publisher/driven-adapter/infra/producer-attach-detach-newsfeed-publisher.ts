import { IQueueService, PRODUCER_ATTACH_DETACH_SERVICE_TOKEN } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { PRODUCER_ATTACH_DETACH_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: PRODUCER_ATTACH_DETACH_PUBLISHER_TOKEN })
export class ProducerAttachDetachNewsfeedPublisher extends BasePublisher {
  public constructor(
    @Inject(PRODUCER_ATTACH_DETACH_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
