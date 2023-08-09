import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ValidationException extends DomainException {
  public static code = ERRORS.API_VALIDATION_ERROR;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Invalid params';
    super(ValidationException.code, message, error);
  }
}

export class InvalidCursorParamsException extends DomainException {
  public static code = ERRORS.CURSOR_PARAMS_INVALID;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.cursor_params_invalid`) || '';
    super(InvalidCursorParamsException.code, message, error);
  }
}
