import { EventsHandlerAndLog } from '@libs/infra/log';
import { SentryService } from '@libs/infra/sentry';
import { Inject, Logger } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { InternalEventEmitterService } from 'apps/api/src/app/custom/event-emitter';
import { SeriesAddedItemsEvent } from 'apps/api/src/events/series';

import { ArticlePublishedEvent } from '../../../domain/event';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ArticlePublishedEvent)
export class ArticlePublishedEventHandler implements IEventHandler<ArticlePublishedEvent> {
  private readonly _logger = new Logger(ArticlePublishedEventHandler.name);

  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    private readonly _sentryService: SentryService,
    // TODO: call domain and using event bus
    private readonly _internalEventEmitter: InternalEventEmitterService
  ) {}

  public async handle(event: ArticlePublishedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    if (articleEntity.isHidden() || !articleEntity.isPublished()) {
      return;
    }

    const seriesIds = articleEntity.getSeriesIds() || [];
    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesAddedItemsEvent({
          itemIds: [articleEntity.getId()],
          seriesId: seriesId,
          actor,
          context: 'publish',
        })
      );
    }

    try {
      const tagEntities = articleEntity.get('tags') || [];
      for (const tag of tagEntities) {
        tag.increaseTotalUsed();
        await this._tagRepository.update(tag);
      }
    } catch (err) {
      this._logger.error(JSON.stringify(err?.stack));
      this._sentryService.captureException(err);
    }
  }
}
