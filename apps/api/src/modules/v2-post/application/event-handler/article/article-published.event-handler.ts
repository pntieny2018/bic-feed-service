import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject, Logger } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  ISeriesDomainService,
  ITagDomainService,
  SERIES_DOMAIN_SERVICE_TOKEN,
  TAG_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ArticlePublishedEvent } from '../../../domain/event';
import { ArticleEntity } from '../../../domain/model/content';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class ArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  private readonly _logger = new Logger(ArticlePublishedEventHandler.name);

  public constructor(
    @Inject(TAG_DOMAIN_SERVICE_TOKEN)
    private readonly _tagDomain: ITagDomainService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomain: ISeriesDomainService
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity, authUser } = event.payload;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    await this._tagDomain.increaseTotalUsedByContent(articleEntity);
    this._processSeriesItemsChanged(articleEntity, authUser);
  }

  private _processSeriesItemsChanged(articleEntity: ArticleEntity, authUser: UserDto): void {
    const seriesIds = articleEntity.getSeriesIds();
    for (const seriesId of seriesIds) {
      this._seriesDomain.sendSeriesItemsAddedEvent({
        authUser,
        seriesId,
        item: articleEntity,
        context: 'publish',
      });
    }
  }
}
