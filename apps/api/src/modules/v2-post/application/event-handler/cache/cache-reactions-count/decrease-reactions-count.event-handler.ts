import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
import { ReactionDeletedEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_ADAPTER,
  IContentCacheAdapter,
} from '@api/modules/v2-post/domain/infra-adapter-interface';
import {
  IPostReactionRepository,
  POST_REACTION_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { merge } from 'lodash';

@EventsHandlerAndLog(ReactionDeletedEvent)
export class CacheDecreaseReactionCountEventHandler implements IEventHandler<ReactionDeletedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_ADAPTER)
    private readonly _contentCacheAdapter: IContentCacheAdapter,
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

    const contentCache = await this._contentCacheAdapter.getContentCached(contentId);
    if (!contentCache) {
      const contentEntity = await this._contentDomainService.getContentForCacheById(contentId);
      await this._contentCacheAdapter.setCacheContents([contentEntity]);
    } else {
      const decreasedValue = await this._contentCacheAdapter.decreaseReactionsCount(
        contentId,
        reactionEntity.get('reactionName')
      );

      if (!decreasedValue) {
        const reactionsCount = await this._postReactionRepository.getAndCountReactionByContents([
          contentId,
        ]);
        await this._contentCacheAdapter.setReactionsCount(
          contentId,
          merge({}, ...(reactionsCount.get(contentId) || []))
        );
      }
    }
  }
}
