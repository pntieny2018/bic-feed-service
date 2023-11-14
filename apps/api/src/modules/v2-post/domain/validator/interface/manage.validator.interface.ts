export type CanManageReportContentPayload = {
  rootGroupId: string;
  userId: string;
};

export interface IManageValidator {
  validateManageReportContent(props: CanManageReportContentPayload): Promise<void>;
}

export const MANAGE_VALIDATOR_TOKEN = 'MANAGE_VALIDATOR_TOKEN';
