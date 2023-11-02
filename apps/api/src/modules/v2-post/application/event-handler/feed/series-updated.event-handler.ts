import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { FeedPublisherService } from '../../../../feed-publisher';
import { SeriesUpdatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(SeriesUpdatedEvent)
export class FeedSeriesUpdatedEventHandler implements IEventHandler<SeriesUpdatedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  public async handle(event: SeriesUpdatedEvent): Promise<void> {
    const { seriesEntity } = event;

    await this._feedPublisherService.fanoutOnWrite(
      seriesEntity.getId(),
      seriesEntity.getGroupIds(),
      seriesEntity.getSnapshot().groupIds
    );
  }
}
