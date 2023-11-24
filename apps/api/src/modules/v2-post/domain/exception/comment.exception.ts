import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';

import { ERRORS } from '../../../../common/constants/errors';
import { DomainNotFoundException } from '../../../../common/exceptions';

export class CommentNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.COMMENT_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.comment.not_found`) || '';
    super(CommentNotFoundException.code, message, error);
  }
}

export class CommentReplyNotExistException extends DomainException {
  public static code = ERRORS.COMMENT_REPLY_NOT_EXISTING;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.comment.reply_not_exist`) || '';
    super(CommentReplyNotExistException.code, message, error);
  }
}

export class CommentNotEmptyException extends DomainException {
  public static code = ERRORS.COMMENT_CAN_NOT_EMPTY;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.comment.can_not_empty`) || '';
    super(CommentNotEmptyException.code, message, error);
  }
}

export class CommentAccessDeniedException extends DomainNotFoundException {
  public static code = ERRORS.COMMENT_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.common.access_denied`) || '';
    super(CommentNotFoundException.code, message, error);
  }
}
