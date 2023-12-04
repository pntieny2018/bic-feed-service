import { EventsHandlerAndLog } from '@libs/infra/log';
import { UserDto } from '@libs/service/user';
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

    const groupIds = uniq(reportEntities.map((reportEntity) => reportEntity.get('groupId')));
    const groupAdminMap = await this._groupAdapter.getGroupAdminMap(groupIds);

    const reportEntityMapByTargetId = EntityHelper.entityArrayToArrayRecord<ReportEntity>(
      reportEntities,
      'targetId'
    );

    for (const targetId of Object.keys(reportEntityMapByTargetId)) {
      await this._sendNotificationByTargetId(
        reportEntityMapByTargetId[targetId],
        authUser,
        groupAdminMap
      );
    }
  }

  private async _sendNotificationByTargetId(
    reportEntities: ReportEntity[],
    authUser: UserDto,
    groupAdminMap: { [groupId: string]: string[] }
  ): Promise<void> {
    const contentOfTargetReported = await this._reportDomain.getContentOfTargetReported(
      reportEntities[0]
    );

    for (const reportEntity of reportEntities) {
      await this._notiAdapter.sendReportCreatedNotification({
        report: this._reportBinding.binding(reportEntity),
        actor: authUser,
        content: contentOfTargetReported,
        adminInfos: { [reportEntity.get('groupId')]: groupAdminMap[reportEntity.get('groupId')] },
      });
    }
  }
}
