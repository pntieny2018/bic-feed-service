import { EntityHelper } from '@api/common/helpers';
import { ReportHiddenEvent } from '@api/modules/v2-post/domain/event';
import { ReportEntity } from '@api/modules/v2-post/domain/model/report';
import {
  IUserNewsfeedRepository,
  USER_NEWSFEED_REPOSITORY_TOKEN,
} from '@api/modules/v2-post/domain/repositoty-interface';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

@EventsHandlerAndLog(ReportHiddenEvent)
export class DetachNewsfeedWhenReportHiddenEventHandler
  implements IEventHandler<ReportHiddenEvent>
{
  public constructor(
    @Inject(USER_NEWSFEED_REPOSITORY_TOKEN)
    private readonly _userNewsfeedRepo: IUserNewsfeedRepository
  ) {}

  public async handle(event: ReportHiddenEvent): Promise<void> {
    const { reportEntities } = event.payload;

    const reportEntityMapByTargetId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );

    for (const targetId of Object.keys(reportEntityMapByTargetId)) {
      const reportEntity = reportEntityMapByTargetId[targetId][0];
      if (reportEntity.isTargetContent()) {
        await this._userNewsfeedRepo.detachContentId(targetId);
      }
    }
  }
}
