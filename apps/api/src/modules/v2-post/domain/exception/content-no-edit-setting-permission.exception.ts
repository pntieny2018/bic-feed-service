import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ContentNoEditSettingPermissionException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.CONTENT_NO_EDIT_SETTING_PERMISSION,
      message || i18n?.t(`error.content.no_edit_setting_permission`),
      errors
    );
  }
}
