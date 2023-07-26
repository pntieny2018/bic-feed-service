import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class UserNoBelongGroupException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.USER.USER_NO_BELONG_GROUP,
      message || i18n?.t(`error.user.no_belong_group`),
      errors
    );
  }
}
