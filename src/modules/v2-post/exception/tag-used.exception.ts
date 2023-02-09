import { NotFoundException } from '@nestjs/common';
import { ERRORS } from '../../../common/constants/errors';

export class TagUsedException extends NotFoundException {
  public constructor(message: string = null) {
    super({
      code: ERRORS.tag.TAG_IS_USED,
      message: message || 'This tag is used',
    });
  }
}
