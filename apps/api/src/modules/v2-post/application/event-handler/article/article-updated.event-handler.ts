import { KAFKA_TOPIC, KafkaService } from '@app/kafka';
import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { ArticleUpdatedEvent } from '../../../domain/event/article.event';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ImageDto, TagDto } from '../../dto';
import { ArticleChangedMessagePayload } from '../../dto/message';

@EventsHandler(ArticleUpdatedEvent)
export class ArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    private readonly _kafkaService: KafkaService
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntityBefore, articleEntityAfter, actor } = event;
    if (!articleEntityAfter.isPublished()) {
      return;
    }

    const contentWithArchivedGroups = (await this._contentRepository.findOne({
      where: {
        id: articleEntityAfter.getId(),
        groupArchived: true,
      },
      include: {
        shouldIncludeSeries: true,
      },
    })) as ArticleEntity;

    const seriesIds = uniq([
      ...articleEntityAfter.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);

    const payload: ArticleChangedMessagePayload = {
      state: 'update',
      before: {
        id: articleEntityBefore.get('id'),
        actor,
        type: articleEntityBefore.get('type'),
        setting: articleEntityBefore.get('setting'),
        groupIds: articleEntityBefore.get('groupIds'),
        seriesIds: articleEntityBefore.get('seriesIds'),
        tags: (articleEntityBefore.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
        title: articleEntityBefore.get('title'),
        summary: articleEntityBefore.get('summary'),
        content: articleEntityBefore.get('content'),
        lang: articleEntityBefore.get('lang'),
        isHidden: articleEntityBefore.get('isHidden'),
        status: articleEntityBefore.get('status'),
        createdAt: articleEntityBefore.get('createdAt'),
        updatedAt: articleEntityBefore.get('updatedAt'),
        publishedAt: articleEntityBefore.get('publishedAt'),
      },
      after: {
        id: articleEntityAfter.get('id'),
        actor,
        type: articleEntityAfter.get('type'),
        setting: articleEntityAfter.get('setting'),
        groupIds: articleEntityAfter.get('groupIds'),
        communityIds: articleEntityAfter.get('communityIds'),
        seriesIds,
        tags: (articleEntityAfter.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
        title: articleEntityAfter.get('title'),
        summary: articleEntityAfter.get('summary'),
        content: articleEntityAfter.get('content'),
        lang: articleEntityAfter.get('lang'),
        state: {
          attachGroupIds: articleEntityAfter.getState().attachGroupIds,
          detachGroupIds: articleEntityAfter.getState().detachGroupIds,
          attachTagIds: articleEntityAfter.getState().attachTagIds,
          detachTagIds: articleEntityAfter.getState().detachTagIds,
          attachSeriesIds: articleEntityAfter.getState().attachSeriesIds,
          detachSeriesIds: articleEntityAfter.getState().detachSeriesIds,
        },
        isHidden: articleEntityAfter.get('isHidden'),
        coverMedia: new ImageDto(articleEntityAfter.get('cover').toObject()),
        status: articleEntityAfter.get('status'),
        createdAt: articleEntityAfter.get('createdAt'),
        updatedAt: articleEntityAfter.get('updatedAt'),
        publishedAt: articleEntityAfter.get('publishedAt'),
      },
    };

    this._kafkaService.emit(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED, {
      key: articleEntityAfter.getId(),
      value: new ArticleChangedMessagePayload(payload),
    });
  }
}
