import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class InvalidCursorParamsException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.CURSOR_PARAMS_INVALID, message || i18n.t(`error.cursor_params_invalid`));
  }
}
