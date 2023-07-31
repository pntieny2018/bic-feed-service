import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ContentNoEditSettingPermissionAtGroupException extends DomainException {
  public constructor(errors?: any, groups?: string[], message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.CONTENT_NO_EDIT_SETTING_PERMISSION_AT_GROUP,
      message ||
        i18n?.t(`error.content.no_edit_setting_permission_at_group`, {
          args: { groups: groups.join(', ') },
        }),
      errors
    );
  }
}
