import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../common/constants/errors';

export class TagNotFoundException extends NotFoundException {
  public constructor(message: string = null) {
    super({
      code: ERRORS.tag.TAG_NOT_FOUND,
      message: message || 'Tag not found',
    });
  }
}
