import { IQueueService, PUBLISH_REMOVE_CONTENT_SERVICE_TOKEN } from '@libs/infra/v2-queue';
import { Component } from '@libs/infra/v2-queue/decorators';
import { Inject } from '@nestjs/common';

import { PUBLISH_REMOVE_CONTENT_PUBLISHER_TOKEN } from '../../provider';

import { BasePublisher } from './base-publisher';

@Component({ injectToken: PUBLISH_REMOVE_CONTENT_PUBLISHER_TOKEN })
export class PublishOrRemoveContentPublisher extends BasePublisher {
  public constructor(
    @Inject(PUBLISH_REMOVE_CONTENT_SERVICE_TOKEN)
    private readonly _queueService: IQueueService
  ) {
    super(_queueService);
  }
}
