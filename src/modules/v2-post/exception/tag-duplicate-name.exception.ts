import { BadRequestException } from '@nestjs/common';
import { ERRORS } from '../../../common/constants/errors';

export class TagDuplicateNameException extends BadRequestException {
  public constructor(message: string = null) {
    super({
      code: ERRORS.tag.TAG_DUPLICATE_NAME,
      message: message || 'Duplicate tag',
    });
  }
}
