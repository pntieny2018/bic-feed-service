import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';

import { FeedPublisherService } from '../../../../feed-publisher';
import { SeriesCreatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(SeriesCreatedEvent)
export class FeedSeriesPublishedEventHandler implements IEventHandler<SeriesCreatedEvent> {
  public constructor(
    // TODO: Change to Adapter
    private readonly _feedPublisherService: FeedPublisherService
  ) {}

  public async handle(event: SeriesCreatedEvent): Promise<void> {
    const { seriesEntity } = event;

    await this._feedPublisherService.fanoutOnWrite(
      seriesEntity.getId(),
      seriesEntity.getGroupIds(),
      []
    );
  }
}
