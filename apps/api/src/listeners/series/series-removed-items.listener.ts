import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SeriesRemovedItemsEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { PostService } from '../../modules/post/post.service';
import { SeriesActivityService } from '../../notification/activities';
import { NotificationService } from '../../notification';

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
    this._logger.debug(
      `[SeriesRemovedItemsListener] seriesId=${event.payload.seriesId} -- itemId=${JSON.stringify(
        event.payload.items[0]
      )}`
    );
    const { seriesId, items, skipNotify } = event.payload;
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

      if (skipNotify) {
        return;
      }

      this._notifyDeletedItems(event).catch((ex) => this._logger.error(ex, ex?.stack));
    }

    const posts = await this._postService.getPostsWithSeries(items.map((item) => item.id));
    for (const post of posts) {
      await this._postSearchService.updateAttributePostToSearch(post, {
        seriesIds: post.postSeries.map((series) => series.seriesId),
      });
    }
  }

  private async _notifyDeletedItems(event: SeriesRemovedItemsEvent): Promise<void> {
    const { seriesId, items, actor, contentIsDeleted } = event.payload;

    const series = await this._postService.getListWithGroupsByIds([seriesId], true);
    if (items.length === 0 || series.length === 0) return;
    if (series[0].createdBy === items[0].createdBy) return;
    const isSendToArticleCreator = items[0].createdBy !== actor.id;
    const activity = await this._seriesActivityService.getDeletingItemToSeriesActivity(
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
  }
}
