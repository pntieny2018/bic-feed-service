import { UserDto } from '../../../../v2-user/application';
import { ImageResource } from '../../../data-type';

export type ImageDto = {
  id: string;
  url: string;
  source: string;
  createdBy: string;
  mimeType: string;
  resource: ImageResource;
  width: number;
  height: number;
  status: string;
};

export interface IMediaValidator {
  validateImagesMedia(images: ImageDto[], actor: UserDto): void;
}

export const MEDIA_VALIDATOR_TOKEN = 'MEDIA_VALIDATOR_TOKEN';
