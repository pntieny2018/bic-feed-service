import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class AccessDeniedException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.CONTENT_ACCESS_DENIED,
      message || i18n?.t(`error.common.access_denied`),
      errors
    );
  }
}
