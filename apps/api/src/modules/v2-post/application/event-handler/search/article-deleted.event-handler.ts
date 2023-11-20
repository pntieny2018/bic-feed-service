import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { ArticleDeletedEvent } from '../../../domain/event';

@EventsHandlerAndLog(ArticleDeletedEvent)
export class SearchArticleDeletedEventHandler implements IEventHandler<ArticleDeletedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: ArticleDeletedEvent): Promise<void> {
    const { articleEntity } = event.payload;

    await this._postSearchService.deletePostsToSearch([{ id: articleEntity.getId() }]);
  }
}
