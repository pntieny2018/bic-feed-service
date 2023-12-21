import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
import { CommentDeletedEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_ADAPTER,
  IContentCacheAdapter,
} from '@api/modules/v2-post/domain/infra-adapter-interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(CommentDeletedEvent)
export class CacheCountCommentDeletedEventHandler implements IEventHandler<CommentDeletedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_ADAPTER)
    private readonly _contentCacheAdapter: IContentCacheAdapter,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async handle(event: CommentDeletedEvent): Promise<void> {
    const { comment } = event.payload;

    const contentId = comment.get('postId');
    const contentCache = await this._contentCacheAdapter.getContentCached(contentId);
    if (!contentCache) {
      const contentEntity = await this._contentDomainService.getContentForCacheById(contentId);
      await this._contentCacheAdapter.setCacheContents([contentEntity]);
    } else {
      const totalReplies = comment.get('totalReply');
      const decreasedValue = totalReplies > 0 ? totalReplies + 1 : 1;
      await this._contentCacheAdapter.decreaseCommentCount(contentId, -decreasedValue);
    }
  }
}
