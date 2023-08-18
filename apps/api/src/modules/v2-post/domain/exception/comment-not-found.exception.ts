import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class CommentNotFoundException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.COMMENT.COMMENT_NOT_FOUND, message || i18n?.t(`error.comment.not_found`), errors);
  }
}
