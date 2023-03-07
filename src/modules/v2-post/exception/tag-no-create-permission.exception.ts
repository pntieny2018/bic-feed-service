import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../common/constants/errors';

export class TagNoCreatePermissionException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', i18n.t(`error.tag.no_delete_permission`));
    super(ERRORS.tag.TAG_NO_CREATE_PERMISSION, message || i18n.t(`error.tag.no_create_permission`));
  }
}
