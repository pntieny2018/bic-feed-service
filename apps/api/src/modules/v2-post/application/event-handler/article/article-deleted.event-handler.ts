import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { KAFKA_TOPIC } from '../../../../../../src/common/constants';
import { ArticleDeletedEvent } from '../../../domain/event';
import { IKafkaAdapter, KAFKA_ADAPTER } from '../../../domain/infra-adapter-interface';
import { ArticleChangedMessagePayload } from '../../dto/message';

@EventsHandler(ArticleDeletedEvent)
export class ArticleDeletedEventHandler implements IEventHandler<ArticleDeletedEvent> {
  public constructor(
    @Inject(KAFKA_ADAPTER)
    private readonly _kafkaAdapter: IKafkaAdapter
  ) {}

  public async handle(event: ArticleDeletedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    if (!articleEntity.isPublished()) {
      return;
    }
    const payload: ArticleChangedMessagePayload = {
      state: 'delete',
      before: {
        id: articleEntity.get('id'),
        actor,
        type: articleEntity.get('type'),
        setting: articleEntity.get('setting'),
        groupIds: articleEntity.get('groupIds'),
        seriesIds: articleEntity.get('seriesIds'),
        title: articleEntity.get('title'),
        summary: articleEntity.get('summary'),
        content: articleEntity.get('content'),
        lang: articleEntity.get('lang'),
        isHidden: articleEntity.get('isHidden'),
        status: articleEntity.get('status'),
        createdAt: articleEntity.get('createdAt'),
        updatedAt: articleEntity.get('updatedAt'),
        publishedAt: articleEntity.get('publishedAt'),
      },
    };

    return this._kafkaAdapter.emit(KAFKA_TOPIC.CONTENT.ARTICLE_CHANGED, {
      key: articleEntity.getId(),
      value: new ArticleChangedMessagePayload(payload),
    });
  }
}
