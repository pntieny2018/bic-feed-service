import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ArticleLimitAttachedSeriesException extends DomainException {
  public constructor(limitNumber?: number) {
    const i18n = I18nContext.current();
    super(
      ERRORS.ARTICLE.ARTICLE_LIMIT_ATTACHED_SERIES,
      i18n.t(`error.article.limit_attached_series`, {
        args: { limit: limitNumber },
      })
    );
  }
}
