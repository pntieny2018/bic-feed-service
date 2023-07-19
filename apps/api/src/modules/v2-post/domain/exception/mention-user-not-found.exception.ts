import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class MentionUserNotFoundException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.MENTION.USER_NOT_FOUND, message || i18n?.t(`error.mention.user_not_found`));
  }
}
