import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';
import { RULES } from '../../constant';

export class PostInvalidParameterException extends DomainException {
  public static code = ERRORS.POST_INVALID_PARAMETER;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Invalid series, tags';
    super(PostInvalidParameterException.code, message, error);
  }
}

export class PostStatusConflictedException extends DomainException {
  public static code = ERRORS.POST_STATUS_CONFLICTED;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Post status is conflicted';
    super(PostStatusConflictedException.code, message, error);
  }
}

export class PostLimitAttachedSeriesException extends DomainException {
  public static code = ERRORS.POST_LIMIT_ATTACHED_SERIES;

  public constructor(
    limitNumber: number = RULES.LIMIT_ATTACHED_SERIES,
    message: string = null,
    error: any = null
  ) {
    const i18n = I18nContext.current();
    message =
      message ||
      i18n?.t(`error.post.limit_attached_series`, { args: { limit: limitNumber } }) ||
      '';

    super(PostLimitAttachedSeriesException.code, message, error);
  }
}
