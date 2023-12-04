import { UserDto } from '@libs/service/user';

import { ReportDto } from '../../../../v2-post/application/dto';

export const REPORT_NOTIFICATION_APPLICATION_SERVICE = 'REPORT_NOTIFICATION_APPLICATION_SERVICE';

export type ReportCreatedNotificationPayload = {
  actor: UserDto;
  report: ReportDto;
  content: string;
  adminInfos: {
    [rootGroupId: string]: string[];
  };
};

export type ReportHiddenNotificationPayload = {
  actor: UserDto;
  reports: ReportDto[];
  content: string;
  adminInfos: {
    [rootGroupId: string]: string[];
  };
};

export interface IReportNotificationApplicationService {
  sendReportCreatedNotification(payload: ReportCreatedNotificationPayload): Promise<void>;
  sendReportHiddenNotification(payload: ReportHiddenNotificationPayload): Promise<void>;
}
