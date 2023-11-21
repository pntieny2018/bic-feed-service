export type ValidateManageReportContentPayload = {
  rootGroupId: string;
  userId: string;
};

export interface IManageValidator {
  validateManageReportContent(props: ValidateManageReportContentPayload): Promise<void>;
}

export const MANAGE_VALIDATOR_TOKEN = 'MANAGE_VALIDATOR_TOKEN';
