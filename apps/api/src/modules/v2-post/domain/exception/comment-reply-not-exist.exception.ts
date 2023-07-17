import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class CommentReplyNotExistException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.COMMENT.REPLY_NOT_EXIST,
      message || i18n?.t(`error.comment.reply_not_exist`),
      errors
    );
  }
}
