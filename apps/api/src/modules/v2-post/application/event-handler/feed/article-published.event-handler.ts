import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { FeedPublisherService } from '../../../../feed-publisher';
import { ArticlePublishedEvent } from '../../../domain/event';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class FeedArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity } = event;

    if (!articleEntity.isPublished()) {
      return;
    }

    await this._feedPublisherService.fanoutOnWrite(
      articleEntity.getId(),
      articleEntity.getGroupIds(),
      []
    );
  }
}
