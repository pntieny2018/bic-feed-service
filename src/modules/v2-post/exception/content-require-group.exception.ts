import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../common/constants/errors';

export class ContentRequireGroupException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.CONTENT_REQUIRE_GROUP,
      message || i18n.t(`error.content.require_group`),
      errors
    );
  }
}
