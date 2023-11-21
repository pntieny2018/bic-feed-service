import { EventsHandlerAndLog } from '@libs/infra/log';
import { Inject } from '@nestjs/common';
import { IEventHandler } from '@nestjs/cqrs';
import { uniq } from 'lodash';

import {
  IReportDomainService,
  REPORT_DOMAIN_SERVICE_TOKEN,
} from '../../../domain/domain-service/interface';
import { ReportCreatedEvent } from '../../../domain/event';
import {
  GROUP_ADAPTER,
  IGroupAdapter,
  INotificationAdapter,
  NOTIFICATION_ADAPTER,
} from '../../../domain/service-adapter-interface';
import { IReportBinding, REPORT_BINDING_TOKEN } from '../../binding';

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
    const { report, authUser } = event.payload;

    const reportDto = this._reportBinding.binding(report);

    const groupIds = uniq(reportDto.details.map((detail) => detail.groupId));
    const groupAdminMap = await this._groupAdapter.getGroupAdminMap(groupIds);

    const contentOfTargetReported = await this._reportDomain.getContentOfTargetReported(report);

    await this._notiAdapter.sendReportCreatedNotification({
      report: reportDto,
      actor: authUser,
      adminInfos: groupAdminMap,
      content: contentOfTargetReported,
    });
  }
}
