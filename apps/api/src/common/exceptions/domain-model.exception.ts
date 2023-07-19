import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../constants/errors';

export class DomainModelException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.DOMAIN_MODEL_VALIDATION,
      message || i18n?.t('error.common.domain_model_validation')
    );
  }
}
