import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ContentNoPinPermissionException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.CONTENT_NO_PIN_PERMISSION,
      message || i18n?.t(`error.content.no_pin_permission`),
      errors
    );
  }
}
