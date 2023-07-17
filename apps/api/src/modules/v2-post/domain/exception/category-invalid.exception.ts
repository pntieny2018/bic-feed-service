import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class CategoryInvalidException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.CATEGORY_INVALID, message || i18n?.t(`error.category_invalid`), errors);
  }
}
