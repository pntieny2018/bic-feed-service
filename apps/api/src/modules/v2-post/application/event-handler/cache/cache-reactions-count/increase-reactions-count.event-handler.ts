import {
  CONTENT_DOMAIN_SERVICE_TOKEN,
  IContentDomainService,
} from '@api/modules/v2-post/domain/domain-service/interface';
import { ReactionCreatedEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_ADAPTER,
  IContentCacheAdapter,
} from '@api/modules/v2-post/domain/infra-adapter-interface';
import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ReactionCreatedEvent)
export class CacheIncreaseReactionCountEventHandler implements IEventHandler<ReactionCreatedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_ADAPTER)
    private readonly _contentCacheAdapter: IContentCacheAdapter,
    @Inject(CONTENT_DOMAIN_SERVICE_TOKEN)
    private readonly _contentDomainService: IContentDomainService
  ) {}

  public async handle(event: ReactionCreatedEvent): Promise<void> {
    const { reactionEntity } = event.payload;

    if (reactionEntity.get('target') === CONTENT_TARGET.COMMENT) {
      return;
    }

    const contentId = reactionEntity.get('targetId');

    const contentCache = await this._contentCacheAdapter.getJson(contentId);
    if (!contentCache) {
      const contentEntity = await this._contentDomainService.getContentForCacheById(contentId);
      await this._contentCacheAdapter.setCacheContents([contentEntity]);
    } else {
      const setReactionsCountNx = await this._contentCacheAdapter.setJsonNx(
        contentId,
        1,
        `reactionsCount.${reactionEntity.get('reactionName')}`
      );

      if (!setReactionsCountNx) {
        await this._contentCacheAdapter.increaseValue(
          contentId,
          `reactionsCount.${reactionEntity.get('reactionName')}`
        );
      }
    }
  }
}
