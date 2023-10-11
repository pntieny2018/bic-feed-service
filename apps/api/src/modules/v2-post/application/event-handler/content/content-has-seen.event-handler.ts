import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { ContentHasSeenEvent } from '../../../domain/event';

@EventsHandlerAndLog(ContentHasSeenEvent)
export class ContentHasSeenEventHandler implements IEventHandler<ContentHasSeenEvent> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async handle(event: ContentHasSeenEvent): Promise<void> {
    const { contentId, userId } = event.payload;

    await this._contentDomainService.markSeen(contentId, userId);
  }
}
