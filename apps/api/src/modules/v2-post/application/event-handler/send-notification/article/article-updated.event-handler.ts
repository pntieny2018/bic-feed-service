import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { ArticleUpdatedEvent } from '../../../../domain/event';
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

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class NotiArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntity, authUser } = event.payload;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

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

    const articleDto = await this._contentBinding.articleBinding(articleEntity, {
      actor: authUser,
      authUser,
    });

    const oldArticleDto = await this._contentBinding.articleAttributesBinding(
      articleEntity.getSnapshot(),
      { actor: authUser, authUser }
    );

    const seriesActorIds = (seriesEntities || []).map((series) => series.get('createdBy'));

    await this._notiAdapter.sendArticleUpdatedNotification({
      actor: authUser,
      article: articleDto,
      oldArticle: oldArticleDto,
      ignoreUserIds: seriesActorIds,
    });
  }
}
