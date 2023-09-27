import { Injectable } from '@nestjs/common';

import { On } from '../../common/decorators';
import { SeriesChangedItemsEvent } from '../../events/series/series-changed-items.event';
import { NotificationService } from '../../notification';
import { SeriesActivityService } from '../../notification/activities';

@Injectable()
export class SeriesChangedItemsListener {
  public constructor(
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
