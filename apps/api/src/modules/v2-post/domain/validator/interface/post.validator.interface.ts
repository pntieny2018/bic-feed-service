import { IContentValidator } from './content.validator.interface';
import { GroupDto } from '../../../../v2-group/application';

export interface IPostValidator extends IContentValidator {
  validateSeriesAndTags(groups: GroupDto[], seriesIds: string[], tagIds: string[]): void;
}

export const POST_VALIDATOR_TOKEN = 'POST_VALIDATOR_TOKEN';
