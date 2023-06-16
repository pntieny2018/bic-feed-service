import { IContentValidator } from './content.validator.interface';
import { GroupDto } from '../../../../v2-group/application';
import { TagEntity } from '../../model/tag';
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
}

export const POST_VALIDATOR_TOKEN = 'POST_VALIDATOR_TOKEN';
