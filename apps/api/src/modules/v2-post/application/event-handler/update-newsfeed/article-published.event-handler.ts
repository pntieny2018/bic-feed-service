import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';
import { ArticlePublishedEvent } from '../../../domain/event';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class FeedArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity, authUser } = event.payload;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    await this._newsfeedDomainService.attachContentToUserId(articleEntity, authUser.id);

    await this._newsfeedDomainService.dispatchContentIdToGroups({
      contentId: articleEntity.getId(),
      newGroupIds: articleEntity.getGroupIds(),
      oldGroupIds: [],
    });
  }
}
