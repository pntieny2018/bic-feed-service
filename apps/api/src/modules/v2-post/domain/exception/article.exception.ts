import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';
import { RULES } from '../../constant';

export class ArticleInvalidParameterException extends DomainException {
  public static code = ERRORS.ARTICLE_INVALID_PARAMETER;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Invalid series, tags';
    super(ArticleInvalidParameterException.code, message, error);
  }
}

export class ArticlePublishInvalidTimeException extends DomainException {
  public static code = ERRORS.ARTICLE_PUBLISH_INVALID_TIME;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Fail schedule';
    super(ArticlePublishInvalidTimeException.code, message, error);
  }
}

export class ArticleRequiredCoverException extends DomainException {
  public static code = ERRORS.ARTICLE_REQUIRED_COVER;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.article.required_cover`) || '';
    super(ArticleRequiredCoverException.code, message, error);
  }
}

export class ArticleLimitAttachedSeriesException extends DomainException {
  public static code = ERRORS.ARTICLE_LIMIT_ATTACHED_SERIES;

  public constructor(
    limitNumber: number = RULES.LIMIT_ATTACHED_SERIES,
    message: string = null,
    error: any = null
  ) {
    const i18n = I18nContext.current();
    message =
      message ||
      i18n?.t(`error.article.limit_attached_series`, { args: { limit: limitNumber } }) ||
      '';

    super(ArticleLimitAttachedSeriesException.code, message, error);
  }
}

export class ArticleInvalidScheduledTimeException extends DomainException {
  public static code = ERRORS.ARTICLE_INVALID_SCHEDULED_TIME;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.article.invalid_scheduled_time`) || '';
    super(ArticleInvalidScheduledTimeException.code, message, error);
  }
}
