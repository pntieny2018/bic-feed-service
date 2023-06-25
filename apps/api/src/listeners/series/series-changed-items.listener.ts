import { Injectable } from '@nestjs/common';
import { On } from '../../common/decorators';
import { SearchService } from '../../modules/search/search.service';
import { SeriesService } from '../../modules/series/series.service';
import { SeriesActivityService } from '../../notification/activities';
import { NotificationService } from '../../notification';
import { PostService } from '../../modules/post/post.service';
import { SeriesChangedItemsEvent } from '../../events/series/series-changed-items.event';

@Injectable()
export class SeriesChangedItemsListener {
  public constructor(
    private readonly _postService: PostService,
    private readonly _seriesService: SeriesService,
    private readonly _postSearchService: SearchService,
    private readonly _notificationService: NotificationService,
    private readonly _seriesActivityService: SeriesActivityService
  ) {}

  @On(SeriesChangedItemsEvent)
  public async handler(event: SeriesChangedItemsEvent): Promise<void> {
    const { actor, content, series } = event.payload;

    const activity = this._seriesActivityService.getChangeSeriesActivity(content, series);

    await this._notificationService.publishPostNotification({
      key: `${series[0].id}`,
      value: {
        event: event.getEventName(),
        actor: {
          id: actor.id,
        },
        data: activity,
        meta: {},
      },
    });
  }
}
