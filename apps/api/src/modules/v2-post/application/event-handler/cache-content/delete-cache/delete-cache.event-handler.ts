import { ContentDeleteCacheEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_ADAPTER,
  IContentCacheAdapter,
} from '@api/modules/v2-post/domain/infra-adapter-interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ContentDeleteCacheEvent)
export class ContentDeleteCacheEventHandler implements IEventHandler<ContentDeleteCacheEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_ADAPTER)
    private readonly contentCacheAdapter: IContentCacheAdapter
  ) {}

  public async handle(event: ContentDeleteCacheEvent): Promise<void> {
    const { contentId } = event.payload;

    await this.contentCacheAdapter.deleteContentCache(contentId);
  }
}
