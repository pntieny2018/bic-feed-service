import { ArticleEntity, PostEntity } from '../../model/content';

export interface ISeriesValidator {
  validateLimtedToAttachSeries(content: PostEntity | ArticleEntity): Promise<void>;
}

export const SERIES_VALIDATOR_TOKEN = 'SERIES_VALIDATOR_TOKEN';
