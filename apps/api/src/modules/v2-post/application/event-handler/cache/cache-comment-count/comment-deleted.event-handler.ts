import { CommentDeletedEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(CommentDeletedEvent)
export class CacheCountCommentDeletedEventHandler implements IEventHandler<CommentDeletedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly _contentCacheRepo: IContentCacheRepository
  ) {}

  public async handle(event: CommentDeletedEvent): Promise<void> {
    const { comment } = event.payload;

    const contentId = comment.get('postId');
    const isCachedContent = await this._contentCacheRepo.existContent(contentId);
    if (isCachedContent) {
      const totalReplies = comment.get('totalReply');
      const decreasedValue = totalReplies > 0 ? totalReplies + 1 : 1;
      await this._contentCacheRepo.decreaseCommentCount(contentId, -decreasedValue);
    }
  }
}
