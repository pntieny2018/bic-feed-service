import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import {
  INewsfeedDomainService,
  NEWSFEED_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface/newsfeed.domain-service.interface';
import { SeriesPublishedEvent } from '../../../domain/event';

@EventsHandlerAndLog(SeriesPublishedEvent)
export class FeedSeriesPublishedEventHandler implements IEventHandler<SeriesPublishedEvent> {
  public constructor(
    @Inject(NEWSFEED_DOMAIN_SERVICE_TOKEN)
    private readonly _newsfeedDomainService: INewsfeedDomainService
  ) {}

  public async handle(event: SeriesPublishedEvent): Promise<void> {
    const { entity: seriesEntity, authUser } = event.payload;

    if (seriesEntity.isHidden() || !seriesEntity.isPublished()) {
      return;
    }

    await this._newsfeedDomainService.attachContentToUserId(seriesEntity, authUser.id);

    await this._newsfeedDomainService.dispatchContentIdToGroups({
      contentId: seriesEntity.getId(),
      newGroupIds: seriesEntity.getGroupIds(),
      oldGroupIds: [],
    });
  }
}
