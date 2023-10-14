import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { FeedPublisherService } from '../../../../feed-publisher';
import { ArticleUpdatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class FeedArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntity } = event;

    await this._feedPublisherService.fanoutOnWrite(
      articleEntity.getId(),
      articleEntity.getGroupIds(),
      articleEntity.getSnapshot().groupIds
    );
  }
}
