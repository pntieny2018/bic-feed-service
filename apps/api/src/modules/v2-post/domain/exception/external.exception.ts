import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class UserNoBelongGroupException extends DomainException {
  public static code = ERRORS.GROUP_NOT_MEMBER;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.user.no_belong_group`) || '';
    super(UserNoBelongGroupException.code, message, error);
  }
}

export class GroupNotFoundException extends DomainException {
  public static code = ERRORS.GROUP_NOT_EXISTING;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Group is not found';
    super(GroupNotFoundException.code, message, error);
  }
}
