import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '../../../domain/domain-service/interface';
import { ContentGetDetailEvent } from '../../../domain/event';

@EventsHandlerAndLog(ContentGetDetailEvent)
export class SeenContentWhenGetDetailEventHandler implements IEventHandler<ContentGetDetailEvent> {
  public constructor(
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async handle(event: ContentGetDetailEvent): Promise<void> {
    const { contentId, userId } = event.payload;

    await this._contentDomainService.markSeen(contentId, userId);
  }
}
