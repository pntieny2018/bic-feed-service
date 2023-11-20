import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { ArticlePublishedEvent } from '../../../../domain/event';
import { ArticleEntity, SeriesEntity } from '../../../../domain/model/content';
import {
  CONTENT_REPOSITORY_TOKEN,
  IContentRepository,
} from '../../../../domain/repositoty-interface';
import {
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../../binding';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class NotiArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity, authUser } = event.payload;

    if (!articleEntity.isPublished()) {
      return;
    }

    const articleDto = await this._contentBinding.articleBinding(articleEntity, {
      actor: authUser,
      authUser,
    });

    const contentWithArchivedGroups = (await this._contentRepository.findContentByIdInArchivedGroup(
      articleEntity.getId(),
      { shouldIncludeSeries: true }
    )) as ArticleEntity;

    const seriesIds = uniq([
      ...articleEntity.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);
    const seriesEntities = (await this._contentRepository.findAll({
      where: {
        groupArchived: false,
        isHidden: false,
        ids: seriesIds,
      },
    })) as SeriesEntity[];
    const seriesActorIds = (seriesEntities || []).map((series) => series.get('createdBy'));

    await this._notiAdapter.sendArticlePublishedNotification({
      actor: authUser,
      article: articleDto,
      ignoreUserIds: seriesActorIds,
    });
  }
}
