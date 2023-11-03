import { IMAGE_RESOURCE, MEDIA_PROCESS_STATUS } from '@beincom/constants';

import { UserDto } from '../../../../v2-user/application';

export type ImageProps = {
  id: string;
  url: string;
  source: string;
  createdBy: string;
  mimeType: string;
  resource: IMAGE_RESOURCE;
  width: number;
  height: number;
  status: MEDIA_PROCESS_STATUS;
};

export interface IMediaValidator {
  validateImagesMedia(images: ImageProps[], actor: UserDto): void;
}

export const MEDIA_VALIDATOR_TOKEN = 'MEDIA_VALIDATOR_TOKEN';
