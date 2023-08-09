import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../constants/errors';

export class DomainModelException extends DomainException {
  public static code = ERRORS.DOMAIN_MODEL_VALIDATION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.common.domain_model_validation`) || '';
    super(DomainModelException.code, message, error);
  }
}
