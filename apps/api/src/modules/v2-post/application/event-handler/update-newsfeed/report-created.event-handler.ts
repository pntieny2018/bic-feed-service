import { EntityHelper } from '@api/common/helpers';
import { ReportCreatedEvent } from '@api/modules/v2-post/domain/event';
import { ReportEntity } from '@api/modules/v2-post/domain/model/report';
import {
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ReportCreatedEvent)
export class DetachNewsfeedWhenReportCreatedEventHandler
  implements IEventHandler<ReportCreatedEvent>
{
  public constructor(
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async handle(event: ReportCreatedEvent): Promise<void> {
    const { reportEntities, authUser } = event.payload;
    const reportEntityMapByTargetId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );

    for (const targetId of Object.keys(reportEntityMapByTargetId)) {
      if (reportEntityMapByTargetId[targetId][0].isTargetContent()) {
        await this._userNewsfeedRepo.detachContentIdFromUserId(targetId, authUser.id);
      }
    }
  }
}
