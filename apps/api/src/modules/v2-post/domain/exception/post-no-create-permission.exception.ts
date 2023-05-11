import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class PostNoCreatePermissionException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.POST.POST_NO_CREATE_PERMISSION,
      message || i18n.t(`error.post.no_create_permission`)
    );
  }
}
