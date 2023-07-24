import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ContentPinLackException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.CONTENT.CONTENT_PIN_LACK, message || i18n?.t(`error.content.pin_lack`), errors);
  }
}
