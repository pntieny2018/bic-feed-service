import { MEDIA_PROCESS_STATUS } from '@beincom/constants';
import { BadRequestException, Injectable } from '@nestjs/common';

import { UserDto } from '../../../v2-user/application';

import { ImageProps, IMediaValidator } from './interface';

@Injectable()
export class MediaValidator implements IMediaValidator {
  /**
   * Validate image media properties
   * @param images ImageMetadataDto
   * @param actor UserDto
   * @throws BadRequestException
   * returns void
   */
  public validateImagesMedia(images: ImageProps[], actor: UserDto): void {
    if (images.length === 0) {
      throw new BadRequestException('Invalid image');
    }
    if (images[0]['createdBy'] !== actor.id) {
      throw new BadRequestException('You must be owner this image');
    }
    if (images[0]['status'] !== MEDIA_PROCESS_STATUS.COMPLETED) {
      throw new BadRequestException('Image is not ready to use');
    }
  }
}
