import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';

import { EntityHelper } from '../../../../../../common/helpers';
import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ReportHiddenEvent } from '../../../../domain/event';
import { ReportEntity } from '../../../../domain/model/report';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../../../binding';

@EventsHandlerAndLog(ReportHiddenEvent)
export class NotiReportHiddenEventHandler implements IEventHandler<ReportHiddenEvent> {
  public constructor(
    @Inject(REPORT_BINDING_TOKEN)
    private readonly _reportBinding: IReportBinding,
    @Inject(REPORT_DOMAIN_SERVICE_TOKEN)
    private readonly _reportDomain: IReportDomainService,
    @Inject(GROUP_ADAPTER)
    private readonly _groupAdapter: IGroupAdapter,
    @Inject(NOTIFICATION_ADAPTER)
    private readonly _notiAdapter: INotificationAdapter
  ) {}

  public async handle(event: ReportHiddenEvent): Promise<void> {
    const { reportEntities, authUser } = event.payload;

    const reportEntityMapByTargetId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );

    for (const targetId of Object.keys(reportEntityMapByTargetId)) {
      await this._sendNotificationByTargetId(reportEntityMapByTargetId[targetId], authUser);
    }
  }

  private async _sendNotificationByTargetId(
    reportEntities: ReportEntity[],
    authUser: UserDto
  ): Promise<void> {
    const contentOfTargetReported = await this._reportDomain.getContentOfTargetReported(
      reportEntities[0]
    );

    for (const reportEntity of reportEntities) {
      const reasonsCountWithReporters =
        await this._reportBinding.bindingReportReasonsCountWithReporters(
          reportEntity.get('reasonsCount')
        );
      const report = this._reportBinding.binding(reportEntity);

      await this._notiAdapter.sendReportHiddenNotification({
        report: { ...report, reasonsCount: reasonsCountWithReporters },
        actor: authUser,
        content: contentOfTargetReported,
      });
    }
  }
}
