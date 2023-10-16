import { EventsHandlerAndLog } from '@libs/infra/log';
import { SentryService } from '@libs/infra/sentry';
import { Inject, Logger } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { InternalEventEmitterService } from '../../../../../app/custom/event-emitter';
import { SeriesRemovedItemsEvent } from '../../../../../events/series';
import { ArticleDeletedEvent } from '../../../domain/event';
import { ITagRepository, TAG_REPOSITORY_TOKEN } from '../../../domain/repositoty-interface';

@EventsHandlerAndLog(ArticleDeletedEvent)
export class ArticleDeletedEventHandler implements IEventHandler<ArticleDeletedEvent> {
  private readonly _logger = new Logger(ArticleDeletedEventHandler.name);

  public constructor(
    @Inject(TAG_REPOSITORY_TOKEN)
    private readonly _tagRepository: ITagRepository,
    private readonly _sentryService: SentryService,
    // TODO: call domain and using event bus
    private readonly _internalEventEmitter: InternalEventEmitterService
  ) {}

  public async handle(event: ArticleDeletedEvent): Promise<void> {
    const { articleEntity, actor } = event;

    if (!articleEntity.isPublished()) {
      return;
    }

    const seriesIds = articleEntity.getSeriesIds() || [];
    for (const seriesId of seriesIds) {
      this._internalEventEmitter.emit(
        new SeriesRemovedItemsEvent({
          items: [
            {
              id: articleEntity.getId(),
              title: articleEntity.getTitle(),
              content: articleEntity.get('content'),
              type: articleEntity.getType(),
              createdBy: articleEntity.getCreatedBy(),
              groupIds: articleEntity.getGroupIds(),
              createdAt: articleEntity.get('createdAt'),
              updatedAt: articleEntity.get('updatedAt'),
            },
          ],
          seriesId: seriesId,
          actor,
          contentIsDeleted: true,
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
