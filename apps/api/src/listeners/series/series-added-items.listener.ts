import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SeriesAddedItemsEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { SeriesActivityService } from '../../notification/activities';
import { NotificationService } from '../../notification';
import { PostService } from '../../modules/post/post.service';

@Injectable()
export class SeriesAddedItemsListener {
  private _logger = new Logger(SeriesAddedItemsListener.name);

  public constructor(
    private readonly _postService: PostService,
    private readonly _seriesService: SeriesService,
    private readonly _postSearchService: SearchService,
    private readonly _notificationService: NotificationService,
    private readonly _seriesActivityService: SeriesActivityService
  ) {}

  @On(SeriesAddedItemsEvent)
  public async handler(event: SeriesAddedItemsEvent): Promise<void> {
    this._logger.debug(
      `[SeriesAddedItemsListener] seriesId=${event.payload.seriesId} -- itemId=${JSON.stringify(
        event.payload.itemIds[0]
      )}`
    );

    const { seriesId, skipNotify } = event.payload;

    await this._updateSeriesAtrribute(event);

    const series = await this._seriesService.findSeriesById(seriesId, {
      withItemId: true,
    });

    if (series) {
      const items = series.items.map((item) => ({
        id: item.id,
        zindex: item['PostSeriesModel'].zindex,
      }));

      this._postSearchService.updateAttributePostToSearch(series, {
        items,
      });
    }

    if (skipNotify) {
      return;
    }

    this._notifyAddedItem(event).catch((ex) => this._logger.error(ex, ex?.stack));
  }

  private async _notifyAddedItem(event: SeriesAddedItemsEvent): Promise<void> {
    const { seriesId, itemIds, actor, context } = event.payload;

    const series = await this._postService.getListWithGroupsByIds([seriesId], true);
    const items = await this._postService.getListWithGroupsByIds([itemIds[0]], true);
    if (items.length === 0 || series.length === 0) return;
    if (series[0].createdBy === items[0].createdBy) return;
    const isSendToArticleCreator = items[0].createdBy !== actor.id;
    const activity = await this._seriesActivityService.getAddingItemToSeriesActivity(
      series[0],
      items[0]
    );
    await this._notificationService.publishPostNotification({
      key: `${series[0].id}`,
      value: {
        actor: {
          id: actor.id,
        },
        event: event.getEventName(),
        data: activity,
        meta: {
          series: {
            isSendToContentCreator: isSendToArticleCreator,
            context,
          },
        },
      },
    });
  }

  private async _updateSeriesAtrribute(event: SeriesAddedItemsEvent): Promise<void> {
    const { itemIds, context } = event.payload;

    if (context === 'publish') return;

    await this._postSearchService.updateSeriesAtrributeForPostSearch(itemIds);
  }
}
