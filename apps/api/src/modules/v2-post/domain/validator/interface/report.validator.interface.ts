export interface IReportValidator {
  checkPermissionManageReport(userId: string, groupId: string): Promise<void>;
}

export const REPORT_VALIDATOR_TOKEN = 'REPORT_VALIDATOR_TOKEN';
