import { BadRequestException } from '@nestjs/common';

export class TagDuplicateNameException extends BadRequestException {
  public constructor(message: string = null) {
    super({
      code: 'tag.duplicate_name',
      message: message || 'Tag is existed',
    });
  }
}
