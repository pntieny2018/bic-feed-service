import { Injectable, Logger } from '@nestjs/common';

import { On } from '../../common/decorators';
import { SeriesAddedItemsEvent } from '../../events/series';
import { PostService } from '../../modules/post/post.service';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { NotificationService } from '../../notification';
import { SeriesActivityService } from '../../notification/activities';

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
    const { seriesId, itemIds, skipNotify, context } = event.payload;
    this._logger.debug(
      `[SeriesAddedItemsListener] seriesId=${seriesId} -- itemId=${JSON.stringify(itemIds[0])}`
    );

    const series = await this._seriesService.findSeriesById(seriesId, {
      withItems: true,
    });

    const items = series.items.map((item) => ({
      id: item.id,
      zindex: item['PostSeriesModel'].zindex,
    }));
    await this._postSearchService.updateAttributePostToSearch(series, {
      items: items.sort((a, b) => {
        return a.zindex - b.zindex;
      }),
    });

    if (context !== 'publish') {
      await this._postSearchService.updateAttachedSeriesForPost(itemIds);
    }

    if (!skipNotify) {
      await this._notifyAddedItem(event);
    }
  }

  private async _notifyAddedItem(event: SeriesAddedItemsEvent): Promise<void> {
    const { seriesId, itemIds, actor, context } = event.payload;

    try {
      const series = await this._postService.getListWithGroupsByIds([seriesId], true);
      const items = await this._postService.getListWithGroupsByIds([itemIds[0]], true);
      if (items.length === 0 || series.length === 0) {
        return;
      }
      if (series[0].createdBy === items[0].createdBy) {
        return;
      }
      const isSendToArticleCreator = items[0].createdBy !== actor.id;
      const activity = this._seriesActivityService.getAddingItemToSeriesActivity(
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
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
    }
  }
}
