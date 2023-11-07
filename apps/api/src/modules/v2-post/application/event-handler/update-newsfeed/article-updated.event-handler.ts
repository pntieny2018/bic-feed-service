import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';
import { ArticleUpdatedEvent } from '../../../domain/event';
import { Inject } from '@nestjs/common';
import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';

@EventsHandlerAndLog(ArticleUpdatedEvent)
export class FeedArticleUpdatedEventHandler implements IEventHandler<ArticleUpdatedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: ArticleUpdatedEvent): Promise<void> {
    const { articleEntity } = event;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }
    await this._newsfeedDomainService.dispatchContentIdToGroups({
      contentId: articleEntity.getId(),
      newGroupIds: articleEntity.getGroupIds(),
      oldGroupIds: articleEntity.getSnapshot().groupIds,
    });
  }
}
