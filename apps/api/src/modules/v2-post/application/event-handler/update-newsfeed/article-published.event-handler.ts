import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';
import { ArticlePublishedEvent } from '../../../domain/event';
import { Inject } from '@nestjs/common';
import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class FeedArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity } = event;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    await this._newsfeedDomainService.dispatchNewsfeed({
      contentId: articleEntity.getId(),
      newGroupIds: articleEntity.getGroupIds(),
      oldGroupIds: [],
    });
  }
}