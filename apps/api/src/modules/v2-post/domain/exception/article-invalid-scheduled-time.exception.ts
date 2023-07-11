import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ArticleInvalidScheduledTimeException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.ARTICLE.ARTICLE_INVALID_SCHEDULED_TIME,
      message || i18n.t(`error.article.invalid_scheduled_time`)
    );
  }
}
