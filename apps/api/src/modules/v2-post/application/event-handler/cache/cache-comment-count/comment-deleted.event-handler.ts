import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
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
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomain: IContentDomainService,
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly _contentCacheRepo: IContentCacheRepository
  ) {}

  public async handle(event: CommentDeletedEvent): Promise<void> {
    const { comment } = event.payload;

    const contentId = comment.get('postId');
    const contentCache = await this._contentCacheRepo.findContent({ where: { id: contentId } });
    if (!contentCache) {
      const contentEntity = await this._contentDomain.getContentForCacheById(contentId);
      await this._contentCacheRepo.setContents([contentEntity]);
    } else {
      const totalReplies = comment.get('totalReply');
      const decreasedValue = totalReplies > 0 ? totalReplies + 1 : 1;
      await this._contentCacheRepo.decreaseCommentCount(contentId, -decreasedValue);
    }
  }
}
