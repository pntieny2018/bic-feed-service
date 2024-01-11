import { CommentCreatedEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(CommentCreatedEvent)
export class CacheCountCommentCreatedEventHandler implements IEventHandler<CommentCreatedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly _contentCacheRepo: IContentCacheRepository
  ) {}

  public async handle(event: CommentCreatedEvent): Promise<void> {
    const { comment } = event.payload;

    const contentId = comment.get('postId');
    const isCachedContent = await this._contentCacheRepo.existContent(contentId);
    if (isCachedContent) {
      await this._contentCacheRepo.increaseCommentCount(contentId);
    }
  }
}
