import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';

import { SearchService } from '../../../../search/search.service';
import { SeriesItemsAddedEvent } from '../../../domain/event';
import { SeriesEntity } from '../../../domain/model/content';
import { CONTENT_REPOSITORY_TOKEN, IContentRepository } from '../../../domain/repositoty-interface';

@EventsHandler(SeriesItemsAddedEvent)
export class SeriesItemsAddedEventHandler implements IEventHandler<SeriesItemsAddedEvent> {
  private _logger = new Logger(SeriesItemsAddedEventHandler.name);

  public constructor(
    private readonly _postSearchService: SearchService,
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly _contentRepository: IContentRepository
  ) {}

  public async handle(event: SeriesItemsAddedEvent): Promise<void> {
    const { seriesId, skipNotify } = event.payload;
    const seriesEntity = (await this._contentRepository.findContentByIdInActiveGroup(seriesId, {
      shouldIncludeItems: true,
    })) as SeriesEntity;

    if (!seriesEntity.isPublished()) {
      return;
    }

    await this._postSearchService.updateAttributePostToSearch(
      { id: seriesEntity.getId(), lang: seriesEntity.get('lang') },
      {
        items: seriesEntity.get('items'),
      }
    );

    if (!skipNotify) {
      await this._notificationHandler(event);
    }
  }

  private async _notificationHandler(event: SeriesItemsAddedEvent): Promise<void> {
    const { seriesId, itemId } = event.payload;

    try {
      const seriesEntity = await this._contentRepository.findContentByIdInActiveGroup(seriesId, {
        mustIncludeGroup: true,
      });
      const contentEntity = await this._contentRepository.findContentByIdInActiveGroup(itemId, {
        mustIncludeGroup: true,
      });

      if (seriesEntity.getCreatedBy() === contentEntity.getCreatedBy()) {
        return;
      }
      /**
       * TODO: Emit notification payload to kafka
       */
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
    }
  }
}
