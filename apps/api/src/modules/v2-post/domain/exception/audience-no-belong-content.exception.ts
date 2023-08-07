import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class AudienceNoBelongContentException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.AUDIENCE_NO_BELONG,
      message || i18n?.t(`error.content.audience_no_belong`),
      errors
    );
  }
}
