import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class CategoryInvalidException extends DomainException {
  public static code = ERRORS.CATEGORY_INVALID;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.category_invalid`) || '';
    super(CategoryInvalidException.code, message, error);
  }
}

export class CategoryNotAllowException extends DomainException {
  public static code = ERRORS.CATEGORY_NOT_ALLOW;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Category not allow';
    super(CategoryNotAllowException.code, message, error);
  }
}
