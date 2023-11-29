import { ArrayHelper } from '@libs/common/helpers';
import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import { EntityHelper } from '../../../../../../common/helpers';
import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../../domain/domain-service/interface';
import { ReportCreatedEvent } from '../../../../domain/event';
import { ReportEntity } from '../../../../domain/model/report';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../../domain/service-adapter-interface';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../../../binding';
import { ReportDto } from '../../../dto';

@EventsHandlerAndLog(ReportCreatedEvent)
export class NotiReportCreatedEventHandler implements IEventHandler<ReportCreatedEvent> {
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

  public async handle(event: ReportCreatedEvent): Promise<void> {
    const { reportEntities, authUser } = event.payload;

    const reports = reportEntities.map((reportEntity) => this._reportBinding.binding(reportEntity));

    const reportEntityMapByTargetId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );
    const reportMapByTargetId = ArrayHelper.convertArrayToArrayRecord<ReportDto>(
      reports,
      'targetId'
    );

    for (const targetId of Object.keys(reportEntityMapByTargetId)) {
      const groupIds = uniq(reportMapByTargetId[targetId].map((report) => report.groupId));
      const groupAdminMap = await this._groupAdapter.getGroupAdminMap(groupIds);

      const contentOfTargetReported = await this._reportDomain.getContentOfTargetReported(
        reportEntityMapByTargetId[targetId][0]
      );

      await this._notiAdapter.sendReportCreatedNotification({
        reports: reportMapByTargetId[targetId],
        actor: authUser,
        adminInfos: groupAdminMap,
        content: contentOfTargetReported,
      });
    }
  }
}
