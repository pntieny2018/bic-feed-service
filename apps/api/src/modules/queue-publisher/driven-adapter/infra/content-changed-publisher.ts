import { IQueueService, CONTENT_CHANGED_SERVICE_TOKEN } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { CONTENT_CHANGED_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: CONTENT_CHANGED_PUBLISHER_TOKEN })
export class ContentChangedPublisher extends BasePublisher {
  public constructor(
    @Inject(CONTENT_CHANGED_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
