import { ReactionCreatedEvent } from '@api/modules/v2-post/domain/event';
import {
  CONTENT_CACHE_REPOSITORY_TOKEN,
  IContentCacheRepository,
} from '@api/modules/v2-post/domain/repositoty-interface/content-cache.repository.interface';
import { CONTENT_TARGET } from '@beincom/constants';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ReactionCreatedEvent)
export class CacheIncreaseReactionCountEventHandler implements IEventHandler<ReactionCreatedEvent> {
  public constructor(
    @Inject(CONTENT_CACHE_REPOSITORY_TOKEN)
    private readonly _contentCacheRepo: IContentCacheRepository
  ) {}

  public async handle(event: ReactionCreatedEvent): Promise<void> {
    const { reactionEntity } = event.payload;

    if (reactionEntity.get('target') === CONTENT_TARGET.COMMENT) {
      return;
    }

    const contentId = reactionEntity.get('targetId');

    const cachedContent = await this._contentCacheRepo.findContent({ where: { id: contentId } });
    if (!cachedContent) {
      await this._contentCacheRepo.cacheContents([contentId]);
    } else {
      const increaseValue = await this._contentCacheRepo.increaseReactionsCount(
        contentId,
        reactionEntity.get('reactionName')
      );

      if (!increaseValue) {
        await this._contentCacheRepo.setReactionNameNx(
          contentId,
          reactionEntity.get('reactionName')
        );
      }
    }
  }
}
