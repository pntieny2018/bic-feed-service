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
import { ArticleDeletedEvent } from '../../../domain/event';
import { ArticleEntity } from '../../../domain/model/content';

@EventsHandlerAndLog(ArticleDeletedEvent)
export class ArticleDeletedEventHandler implements IEventHandler<ArticleDeletedEvent> {
  private readonly _logger = new Logger(ArticleDeletedEventHandler.name);

  public constructor(
    @Inject(TAG_DOMAIN_SERVICE_TOKEN)
    private readonly _tagDomain: ITagDomainService,
    @Inject(SERIES_DOMAIN_SERVICE_TOKEN)
    private readonly _seriesDomain: ISeriesDomainService
  ) {}

  public async handle(event: ArticleDeletedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    if (!articleEntity.isPublished()) {
      return;
    }

    await this._tagDomain.decreaseTotalUsedByContent(articleEntity);
    this._processSeriesItemsChanged(articleEntity, actor);
  }

  private _processSeriesItemsChanged(articleEntity: ArticleEntity, actor: UserDto): void {
    const seriesIds = articleEntity.getSeriesIds();
    for (const seriesId of seriesIds) {
      this._seriesDomain.sendSeriesItemsRemovedEvent({
        authUser: actor,
        seriesId,
        item: articleEntity,
        contentIsDeleted: true,
      });
    }
  }
}
