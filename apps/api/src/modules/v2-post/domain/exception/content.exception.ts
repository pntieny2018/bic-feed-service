import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';

import { ERRORS } from '../../../../common/constants/errors';
import { DomainForbiddenException, DomainNotFoundException } from '../../../../common/exceptions';

export class ContentNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.CONTENT_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.not_found`) || '';
    super(ContentNotFoundException.code, message, error);
  }
}

export class ContentEmptyContentException extends DomainException {
  public static code = ERRORS.CONTENT_EMPTY_CONTENT;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.empty`) || '';
    super(ContentEmptyContentException.code, message, error);
  }
}

export class ContentEmptyGroupException extends DomainException {
  public static code = ERRORS.CONTENT_EMPTY_GROUP;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.empty_group`) || '';
    super(ContentEmptyGroupException.code, message, error);
  }
}

export class ContentRequireGroupException extends DomainForbiddenException {
  public static code = ERRORS.CONTENT_GROUP_JOIN_REQUIRED;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.group_join_required`) || '';
    super(ContentRequireGroupException.code, message, error);
  }
}

export class AudienceNoBelongContentException extends DomainException {
  public static code = ERRORS.CONTENT_NO_BELONG_GROUP;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.audience_no_belong`) || '';
    super(AudienceNoBelongContentException.code, message, error);
  }
}

export class ContentNoCRUDPermissionException extends DomainForbiddenException {
  public static code = ERRORS.CONTENT_NO_CRUD_PERMISSION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.no_crud_permission`) || '';
    super(ContentNoCRUDPermissionException.code, message, error);
  }
}

export class ContentNoCRUDPermissionAtGroupException extends DomainForbiddenException {
  public static code = ERRORS.CONTENT_NO_CRUD_PERMISSION_AT_GROUP;

  public constructor(groups: string[] = [], message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message =
      message ||
      i18n?.t(`error.content.no_crud_permission_at_group`, {
        args: { groups: groups.join(', ') },
      }) ||
      '';

    super(ContentNoCRUDPermissionAtGroupException.code, message, error);
  }
}

export class ContentNoEditSettingPermissionException extends DomainException {
  public static code = ERRORS.CONTENT_NO_EDIT_SETTING_PERMISSION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.no_edit_setting_permission`) || '';
    super(ContentNoEditSettingPermissionException.code, message, error);
  }
}

export class ContentNoEditSettingPermissionAtGroupException extends DomainForbiddenException {
  public static code = ERRORS.CONTENT_NO_EDIT_SETTING_PERMISSION_AT_GROUP;

  public constructor(groups: string[] = [], message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message =
      message ||
      i18n?.t(`error.content.no_edit_setting_permission_at_group`, {
        args: { groups: groups.join(', ') },
      }) ||
      '';

    super(ContentNoEditSettingPermissionAtGroupException.code, message, error);
  }
}

export class ContentNoCommentPermissionException extends DomainException {
  public static code = ERRORS.CONTENT_NO_COMMENT_PERMISSION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.no_comment_permission`) || '';
    super(ContentNoCommentPermissionException.code, message, error);
  }
}

export class ContentNoPinPermissionException extends DomainForbiddenException {
  public static code = ERRORS.CONTENT_NO_PIN_PERMISSION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.no_pin_permission`) || '';
    super(ContentNoPinPermissionException.code, message, error);
  }
}

export class ContentAccessDeniedException extends DomainForbiddenException {
  public static code = ERRORS.CONTENT_ACCESS_DENIED;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.common.access_denied`) || '';
    super(ContentAccessDeniedException.code, message, error);
  }
}

export class ContentPinNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.CONTENT_PIN_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.pin_not_found`) || '';
    super(ContentPinNotFoundException.code, message, error);
  }
}

export class ContentPinLackException extends DomainException {
  public static code = ERRORS.CONTENT_PIN_LACK;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.pin_lack`) || '';
    super(ContentPinLackException.code, message, error);
  }
}

export class ContentNoPublishYetException extends DomainException {
  public static code = ERRORS.CONTENT_NO_PUBLISH_YET;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.no_publish_yet`) || '';
    super(ContentNoPublishYetException.code, message, error);
  }
}

export class ContentHasBeenPublishedException extends DomainException {
  public static code = ERRORS.CONTENT_HAS_BEEN_PUBLISHED;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.has_been_published`) || '';
    super(ContentHasBeenPublishedException.code, message, error);
  }
}

export class ContentHasQuizException extends DomainException {
  public static code = ERRORS.CONTENT_QUIZ_EXISTED;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.has_quiz`) || '';
    super(ContentHasQuizException.code, message, error);
  }
}

export class ContentInvalidScheduledTimeException extends DomainException {
  public static code = ERRORS.CONTENT_INVALID_SCHEDULED_TIME;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.invalid_scheduled_time`) || '';
    super(ContentInvalidScheduledTimeException.code, message, error);
  }
}
