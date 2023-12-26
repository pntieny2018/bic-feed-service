import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
import { ReactionDeletedEvent } from '@api/modules/v2-post/domain/event';
import {
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { merge } from 'lodash';

@EventsHandlerAndLog(ReactionDeletedEvent)
export class CacheDecreaseReactionCountEventHandler implements IEventHandler<ReactionDeletedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly _contentCacheRepository: IContentCacheRepository,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService,
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly _postReactionRepository: IPostReactionRepository
  ) {}

  public async handle(event: ReactionDeletedEvent): Promise<void> {
    const { reactionEntity } = event.payload;

    if (reactionEntity.get('target') === CONTENT_TARGET.COMMENT) {
      return;
    }

    const contentId = reactionEntity.get('targetId');

    const contentCache = await this._contentCacheRepository.getContent(contentId);
    if (!contentCache) {
      const contentEntity = await this._contentDomainService.getContentForCacheById(contentId);
      await this._contentCacheRepository.setContents([contentEntity]);
    } else {
      const decreasedValue = await this._contentCacheRepository.decreaseReactionsCount(
        contentId,
        reactionEntity.get('reactionName')
      );

      if (!decreasedValue) {
        const reactionsCount = await this._postReactionRepository.getAndCountReactionByContents([
          contentId,
        ]);
        await this._contentCacheRepository.setReactionsCount(
          contentId,
          merge({}, ...(reactionsCount.get(contentId) || []))
        );
      }
    }
  }
}
