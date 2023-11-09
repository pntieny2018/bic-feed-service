export type ValidateAdminRootGroupPayload = {
  rootGroupId: string;
  userId: string;
};

export interface IReportContentValidator {
  validateAdminRootGroup(props: ValidateAdminRootGroupPayload): Promise<void>;
}

export const REPORT_CONTENT_VALIDATOR_TOKEN = 'REPORT_CONTENT_VALIDATOR_TOKEN';
