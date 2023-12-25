import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { PostDeletedEvent } from '../../../domain/event';

@EventsHandlerAndLog(PostDeletedEvent)
export class SearchPostDeletedEventHandler implements IEventHandler<PostDeletedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _postSearchService: SearchService
  ) {}

  public async handle(event: PostDeletedEvent): Promise<void> {
    const { entity: postEntity } = event.payload;

    await this._postSearchService.deletePostsToSearch([{ id: postEntity.getId() }]);
  }
}
