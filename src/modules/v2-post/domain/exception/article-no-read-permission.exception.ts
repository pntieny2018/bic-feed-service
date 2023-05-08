import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ArticleNoReadPermissionException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.ARTICLE.ARTICLE_NO_READ_PERMISSION,
      message || i18n.t(`error.article.no_read_permission`)
    );
  }
}
