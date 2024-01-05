import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
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
    private readonly contentCacheRepository: IContentCacheRepository,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async handle(event: CommentCreatedEvent): Promise<void> {
    const { comment } = event.payload;

    const contentId = comment.get('postId');
    const contentCache = await this.contentCacheRepository.getContent(contentId);
    if (!contentCache) {
      const contentEntity = await this._contentDomainService.getContentForCacheById(contentId);
      await this.contentCacheRepository.setContents([contentEntity]);
    } else {
      await this.contentCacheRepository.increaseCommentCount(contentId);
    }
  }
}
