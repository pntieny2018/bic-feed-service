import { IContentValidator } from './content.validator.interface';
import { PostEntity } from '../../model/content';

export interface IPostValidator extends IContentValidator {
  validateAndSetMedia(
    postEntity: PostEntity,
    media: {
      filesIds?: string[];
      imagesIds?: string[];
      videosIds?: string[];
    }
  ): void;

  validateLimtedToAttachSeries(postEntity: PostEntity): Promise<void>;
}

export const POST_VALIDATOR_TOKEN = 'POST_VALIDATOR_TOKEN';
