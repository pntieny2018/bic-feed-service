import { IContentValidator } from './content.validator.interface';

export interface IPostValidator extends IContentValidator {
  validateSeriesAndTags(groupIds: string[], seriesIds: string[], tagIds: string[]): void;
}

export const POST_VALIDATOR_TOKEN = 'POST_VALIDATOR_TOKEN';
