import { UserDto } from '../../../../v2-user/application';
import { ImageDto } from '../../../application/dto';

export interface IMediaValidator {
  validateImagesMedia(images: ImageDto[], actor: UserDto): void;
}

export const MEDIA_VALIDATOR_TOKEN = 'MEDIA_VALIDATOR_TOKEN';
