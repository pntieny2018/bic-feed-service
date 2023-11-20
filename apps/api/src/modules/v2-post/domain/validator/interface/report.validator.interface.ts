import { ReportEntity } from '../../model/report';

export interface IReportValidator {
  checkPermissionManageReport(userId: string, groupId: string): Promise<void>;
  validateReportInGroup(reportEntity: ReportEntity, groupId: string): void;
}

export const REPORT_VALIDATOR_TOKEN = 'REPORT_VALIDATOR_TOKEN';
