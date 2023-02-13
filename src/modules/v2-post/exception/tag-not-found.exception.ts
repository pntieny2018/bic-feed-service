import { NotFoundException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../common/constants/errors';

export class TagNotFoundException extends NotFoundException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.tag.TAG_NOT_FOUND, message || i18n.translate('error.tag.not_found'));
  }
}
