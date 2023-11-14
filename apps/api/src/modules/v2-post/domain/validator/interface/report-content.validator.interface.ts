export type CanManageReportContentPayload = {
  rootGroupId: string;
  userId: string;
};

export interface IReportContentValidator {
  canManageReportContent(props: CanManageReportContentPayload): Promise<void>;
}

export const REPORT_CONTENT_VALIDATOR_TOKEN = 'REPORT_CONTENT_VALIDATOR_TOKEN';
