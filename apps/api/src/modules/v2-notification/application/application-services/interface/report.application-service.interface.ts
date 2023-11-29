import { UserDto } from '@libs/service/user';

import { ReportDto } from '../../../../v2-post/application/dto';

export const REPORT_NOTIFICATION_APPLICATION_SERVICE = 'REPORT_NOTIFICATION_APPLICATION_SERVICE';

export type ReportNotificationPayload = {
  actor: UserDto;
  reports: ReportDto[];
  adminInfos: {
    [rootGroupId: string]: string[];
  };
  content: string;
};

export interface IReportNotificationApplicationService {
  sendReportCreatedNotification(payload: ReportNotificationPayload): Promise<void>;
  sendReportHiddenNotification(payload: ReportNotificationPayload): Promise<void>;
}
