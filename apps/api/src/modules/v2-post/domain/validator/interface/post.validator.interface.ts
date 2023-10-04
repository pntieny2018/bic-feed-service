import { PostEntity } from '../../model/content';

import { IContentValidator } from './content.validator.interface';

export interface IPostValidator extends IContentValidator {
  validateLimitedToAttachSeries(postEntity: PostEntity): Promise<void>;
}

export const POST_VALIDATOR_TOKEN = 'POST_VALIDATOR_TOKEN';
