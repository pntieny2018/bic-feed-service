import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { ReactionDeletedEvent } from '../../../domain/event';
import { CACHE_ADAPTER, ICacheAdapter } from '../../../domain/infra-adapter-interface';

@EventsHandlerAndLog(ReactionDeletedEvent)
export class CacheDecreaseReactionCountEventHandler implements IEventHandler<ReactionDeletedEvent> {
  public constructor(
    @Inject(CACHE_ADAPTER)
    private readonly _cacheAdapter: ICacheAdapter
  ) {}

  public async handle(event: ReactionDeletedEvent): Promise<void> {
    const { reactionEntity } = event.payload;

    if (reactionEntity.get('target') === CONTENT_TARGET.COMMENT) {
      return;
    }

    const contentId = reactionEntity.get('targetId');

    const contentCache = await this._cacheAdapter.getJson(contentId);
    if (!contentCache) {
      await this._cacheAdapter.setJson(contentId, { id: contentId, reactionCounts: {} });
    }

    const resSetNx = await this._cacheAdapter.setJsonNx(
      contentId,
      0,
      `reactionCounts.${reactionEntity.get('reactionName')}`
    );

    if (!resSetNx) {
      await this._cacheAdapter.decreaseValue(
        contentId,
        `reactionCounts.${reactionEntity.get('reactionName')}`
      );
    }
  }
}
