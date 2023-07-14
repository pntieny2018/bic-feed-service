import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ArticleRequiredCoverException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.ARTICLE.ARTICLE_REQUIRED_COVER, message || i18n.t(`error.article.required_cover`));
  }
}
