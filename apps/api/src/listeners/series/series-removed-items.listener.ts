import { Injectable, Logger } from '@nestjs/common';

import { On } from '../../common/decorators';
import { SeriesRemovedItemsEvent } from '../../events/series';
import { PostService } from '../../modules/post/post.service';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { NotificationService } from '../../notification';
import { SeriesActivityService } from '../../notification/activities';

@Injectable()
export class SeriesRemovedItemsListener {
  private _logger = new Logger(SeriesRemovedItemsListener.name);

  public constructor(
    private readonly _seriesService: SeriesService,
    private readonly _postService: PostService,
    private readonly _postSearchService: SearchService,
    private readonly _seriesActivityService: SeriesActivityService,
    private readonly _notificationService: NotificationService
  ) {}

  @On(SeriesRemovedItemsEvent)
  public async handler(event: SeriesRemovedItemsEvent): Promise<void> {
    const { seriesId, items, skipNotify } = event.payload;
    this._logger.debug(
      `[SeriesRemovedItemsListener] seriesId=${seriesId} -- itemId=${JSON.stringify(items[0])}`
    );

    const series = await this._seriesService.findSeriesById(seriesId, {
      withItems: true,
    });

    const currentItems = series.items.map((item) => ({
      id: item.id,
      zindex: item['PostSeriesModel'].zindex,
    }));
    await this._postSearchService.updateAttributePostToSearch(series, {
      items: currentItems.sort((a, b) => {
        return a.zindex - b.zindex;
      }),
    });

    await this._postSearchService.updateAttachedSeriesForPost(items.map((item) => item.id));

    if (!skipNotify) {
      await this._notifyDeletedItems(event).catch((ex) => this._logger.error(ex, ex?.stack));
    }
  }

  private async _notifyDeletedItems(event: SeriesRemovedItemsEvent): Promise<void> {
    const { seriesId, items, actor, contentIsDeleted } = event.payload;

    try {
      const series = await this._postService.getListWithGroupsByIds([seriesId], true);
      if (items.length === 0 || series.length === 0) {
        return;
      }
      if (series[0].createdBy === items[0].createdBy) {
        return;
      }
      const isSendToArticleCreator = items[0].createdBy !== actor.id;
      const activity = this._seriesActivityService.getDeletingItemToSeriesActivity(
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
              contentIsDeleted,
            },
          },
        },
      });
    } catch (ex) {
      this._logger.error(ex, ex?.stack);
    }
  }
}
