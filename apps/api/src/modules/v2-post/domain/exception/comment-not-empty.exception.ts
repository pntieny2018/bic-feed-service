import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class CommentNotEmptyException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.COMMENT.CAN_NOT_EMPTY, message || i18n?.t(`error.comment.can_not_empty`));
  }
}
