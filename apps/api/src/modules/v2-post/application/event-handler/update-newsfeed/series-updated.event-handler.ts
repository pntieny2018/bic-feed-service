import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';
import { SeriesUpdatedEvent } from '../../../domain/event';

@EventsHandlerAndLog(SeriesUpdatedEvent)
export class FeedSeriesUpdatedEventHandler implements IEventHandler<SeriesUpdatedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: SeriesUpdatedEvent): Promise<void> {
    const { entity: seriesEntity } = event.payload;

    if (seriesEntity.isHidden() || !seriesEntity.isPublished()) {
      return;
    }
    await this._newsfeedDomainService.dispatchContentIdToGroups({
      contentId: seriesEntity.getId(),
      newGroupIds: seriesEntity.getGroupIds(),
      oldGroupIds: seriesEntity.getSnapshot().groupIds,
    });
  }
}
