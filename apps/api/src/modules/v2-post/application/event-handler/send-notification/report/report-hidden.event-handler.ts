import { EventsHandlerAndLog } from '@libs/infra/log';
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
      const entities = reportEntityMapByTargetId[targetId];

      const contentOfTarget = await this._reportDomain.getContentOfTargetReported(entities[0]);
      const reports = await this._reportBinding.bindingReportsWithReportersInReasonsCount(entities);

      await this._notiAdapter.sendReportHiddenNotification({
        reports,
        actor: authUser,
        content: contentOfTarget,
      });
    }
  }
}
