import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';
import { DomainForbiddenException, DomainNotFoundException } from '../../../../common/exceptions';

export class TagNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.TAG_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.tag.not_found`) || '';
    super(TagNotFoundException.code, message, error);
  }
}

export class TagUsedException extends DomainException {
  public static code = ERRORS.TAG_IS_USED;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.tag.is_used`) || '';
    super(TagUsedException.code, message, error);
  }
}

export class TagDuplicateNameException extends DomainException {
  public static code = ERRORS.TAG_NAME_DUPLICATE;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.tag.duplicate_name`) || '';
    super(TagDuplicateNameException.code, message, error);
  }
}

export class TagSeriesInvalidException extends DomainException {
  public static code = ERRORS.TAG_SERIES_INVALID;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.tag.series_invalid`) || '';
    super(TagSeriesInvalidException.code, message, error);
  }
}

export class TagNoCreatePermissionException extends DomainForbiddenException {
  public static code = ERRORS.TAG_NO_CREATE_PERMISSION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.tag.no_create_permission`) || '';
    super(TagNoCreatePermissionException.code, message, error);
  }
}

export class TagNoUpdatePermissionException extends DomainForbiddenException {
  public static code = ERRORS.TAG_NO_UPDATE_PERMISSION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.tag.no_update_permission`) || '';
    super(TagNoUpdatePermissionException.code, message, error);
  }
}

export class TagNoDeletePermissionException extends DomainForbiddenException {
  public static code = ERRORS.TAG_NO_DELETE_PERMISSION;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.tag.no_delete_permission`) || '';
    super(TagNoDeletePermissionException.code, message, error);
  }
}
