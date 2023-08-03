import { BadRequestException, Injectable } from '@nestjs/common';
import { UserDto } from '../../../v2-user/application';
import { MediaStatus } from '../../data-type';
import { ImageDto } from '../model/media/type/media.dto';
import { IMediaValidator } from './interface';

@Injectable()
export class MediaValidator implements IMediaValidator {
  /**
   * Validate image media properties
   * @param images ImageMetadataDto
   * @param actor UserDto
   * @throws BadRequestException
   * returns void
   */
  public validateImagesMedia(images: ImageDto[], actor: UserDto): void {
    if (images.length === 0) {
      throw new BadRequestException('Invalid image');
    }
    if (images[0]['createdBy'] !== actor.id) {
      throw new BadRequestException('You must be owner this image');
    }
    if (images[0]['status'] !== MediaStatus.DONE) {
      throw new BadRequestException('Image is not ready to use');
    }
  }
}
