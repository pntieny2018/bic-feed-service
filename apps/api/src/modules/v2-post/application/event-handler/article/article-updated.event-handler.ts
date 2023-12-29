import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  ITagDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ArticleUpdatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class ArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomain: ISeriesDomainService,
    @Inject(TAG_DOMAIN_SERVICE_TOKEN)
    private readonly _tagDomain: ITagDomainService
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntity, authUser } = event.payload;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    await this._tagDomain.updateTagsUsedByContent(articleEntity);
    await this._seriesDomain.sendContentUpdatedSeriesEvent({
      content: articleEntity,
      actor: authUser,
    });
  }
}
