import { ArrayHelper } from '@libs/common/helpers';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { ArticleHasBeenUpdated } from '../../../../../common/constants';
import { ArticleUpdatedEvent } from '../../../domain/event';
import { ArticleEntity, SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { CONTENT_BINDING_TOKEN, IContentBinding } from '../../binding';
import { ArticleDto, QuizDto } from '../../dto';

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class NotiArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(CONTENT_BINDING_TOKEN)
    private readonly _contentBinding: IContentBinding,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    if (articleEntity.isHidden()) {
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
      actor,
      authUser: actor,
    });

    const oldArticle = articleEntity.getSnapshot();
    const oldGroups = await this._groupAdapter.getGroupsByIds(oldArticle.groupIds);
    const oldCommunities = await this._groupAdapter.getGroupsByIds(
      ArrayHelper.arrayUnique(oldGroups.map((group) => group.rootGroupId))
    );
    const oldSeriesEntities = await this._contentRepository.findAll({
      attributes: {
        exclude: ['content'],
      },
      where: {
        groupArchived: false,
        isHidden: false,
        ids: oldArticle.seriesIds,
      },
    });
    const oldArticleDto = new ArticleDto({
      ...oldArticle,
      audience: {
        groups: oldGroups,
      },
      communities: oldCommunities,
      categories: (oldArticle.categories || []).map((item) => ({
        id: item.get('id'),
        name: item.get('name'),
      })),
      tags: (oldArticle.tags || []).map((tag) => ({
        id: tag.get('id'),
        name: tag.get('name'),
        groupId: tag.get('groupId'),
      })),
      series: (oldSeriesEntities || []).map((series) => ({
        id: series.getId(),
        title: series.getTitle(),
        createdBy: series.getCreatedBy(),
      })),
      quiz: oldArticle.quiz?.isVisible(actor.id)
        ? new QuizDto({
            id: articleEntity.get('quiz').get('id'),
            title: articleEntity.get('quiz').get('title'),
            description: articleEntity.get('quiz').get('description'),
            status: articleEntity.get('quiz').get('status'),
            genStatus: articleEntity.get('quiz').get('genStatus'),
            error: articleEntity.get('quiz').get('error'),
          })
        : undefined,
      actor,
    });

    const seriesActorIds = (seriesEntities || []).map((series) => series.get('createdBy'));

    await this._notiAdapter.sendArticleNotification({
      event: ArticleHasBeenUpdated,
      actor,
      article: articleDto,
      oldArticle: oldArticleDto,
      ignoreUserIds: seriesActorIds,
    });
  }
}
