import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { KAFKA_TOPIC } from '../../../../../../src/common/constants';
import { ArticlePublishedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { ArticleEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';
import { ImageDto, TagDto } from '../../dto';
import { ArticleChangedMessagePayload } from '../../dto/message';

@EventsHandler(ArticlePublishedEvent)
export class ArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  public constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository,
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity, actor } = event;
    if (!articleEntity.isPublished()) {
      return;
    }

    const contentWithArchivedGroups = (await this._contentRepository.findOne({
      where: {
        id: articleEntity.getId(),
        groupArchived: true,
      },
      include: {
        shouldIncludeSeries: true,
      },
    })) as ArticleEntity;

    const seriesIds = uniq([
      ...articleEntity.getSeriesIds(),
      ...(contentWithArchivedGroups ? contentWithArchivedGroups?.getSeriesIds() : []),
    ]);

    const payload: ArticleChangedMessagePayload = {
      state: 'publish',
      after: {
        id: articleEntity.get('id'),
        actor,
        type: articleEntity.get('type'),
        setting: articleEntity.get('setting'),
        groupIds: articleEntity.get('groupIds'),
        communityIds: articleEntity.get('communityIds'),
        seriesIds,
        tags: (articleEntity.get('tags') || []).map((tag) => new TagDto(tag.toObject())),
        title: articleEntity.get('title'),
        summary: articleEntity.get('summary'),
        content: articleEntity.get('content'),
        lang: articleEntity.get('lang'),
        isHidden: articleEntity.get('isHidden'),
        coverMedia: new ImageDto(articleEntity.get('cover').toObject()),
        status: articleEntity.get('status'),
        createdAt: articleEntity.get('createdAt'),
        updatedAt: articleEntity.get('updatedAt'),
        publishedAt: articleEntity.get('publishedAt'),
      },
    };

    this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED, {
      key: articleEntity.getId(),
      value: new ArticleChangedMessagePayload(payload),
    });
  }
}
