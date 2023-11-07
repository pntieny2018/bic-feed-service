import { EventsHandlerAndLog } from '@libs/infra/log';
import { IEventHandler } from '@nestjs/cqrs';
import { SeriesCreatedEvent } from '../../../domain/event';
import { Inject } from '@nestjs/common';
import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';

@EventsHandlerAndLog(SeriesCreatedEvent)
export class FeedSeriesPublishedEventHandler implements IEventHandler<SeriesCreatedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: SeriesCreatedEvent): Promise<void> {
    const { seriesEntity } = event;

    if (seriesEntity.isHidden() || !seriesEntity.isPublished()) {
      return;
    }
    await this._newsfeedDomainService.dispatchContentIdToGroups({
      contentId: seriesEntity.getId(),
      newGroupIds: seriesEntity.getGroupIds(),
      oldGroupIds: [],
    });
  }
}
