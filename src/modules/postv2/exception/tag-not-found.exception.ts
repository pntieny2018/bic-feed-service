import { NotFoundException } from '@nestjs/common';

export class TagDuplicateNameException extends NotFoundException {
  public constructor(message: string = null) {
    super({
      code: 'tag.not_found',
      message: message || 'Tag is existed',
    });
  }
}
