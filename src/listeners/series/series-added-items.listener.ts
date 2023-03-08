import { Injectable, Logger } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SeriesAddedItemsEvent } from '../../events/series';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { SeriesActivityService } from '../../notification/activities';
import { SeriesAddItem } from '../../common/constants';
import { NotificationService } from '../../notification';
import { UserDto } from '../../modules/v2-user/application';
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
    this._logger.debug(`[SeriesAddedItemsListener] ${JSON.stringify(event.payload)}`);

    const { seriesId } = event.payload;

    const series = await this._seriesService.findSeriesById(seriesId, {
      withItemId: true,
    });

    this._notifyAddedItem(event.payload).catch((ex) => this._logger.error(ex, ex?.stack));

    if (series) {
      const items = series.items.map((item) => ({
        id: item.id,
        zindex: item['PostSeriesModel'].zindex,
      }));

      this._postSearchService.updateAttributePostToSearch(series, {
        items,
      });
    }
  }

  private async _notifyAddedItem(data: {
    seriesId: string;
    itemIds: string[];
    actor: UserDto;
  }): Promise<void> {
    const { seriesId, itemIds, actor } = data;

    const series = await this._postService.getListWithGroupsByIds([seriesId], true);
    const items = await this._postService.getListWithGroupsByIds([itemIds[0]], true);
    if (items.length === 0 || series.length === 0) return;
    if (series[0].createdBy === items[0].createdBy) return;

    const isSendToArticleCreator = series[0].createdBy === actor.id;
    const activity = await this._seriesActivityService.getAddingItemToSeriesActivity(
      series[0],
      items[0]
    );

    this._notificationService.publishPostNotification({
      key: `${series[0].id}`,
      value: {
        actor,
        event: SeriesAddedItemsEvent.name,
        data: activity,
        meta: {
          series: {
            isSendToArticleCreator: isSendToArticleCreator,
          },
        },
      },
    });
  }
}
