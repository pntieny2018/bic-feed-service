import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';
import { DomainNotFoundException } from '../../../../common/exceptions';

export class ReactionNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.REACTION_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.reaction.not_found`) || '';
    super(ReactionNotFoundException.code, message, error);
  }
}

export class ReactionDuplicateException extends DomainException {
  public static code = ERRORS.REACTION_DUPLICATE;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.reaction.duplicate`) || '';
    super(ReactionDuplicateException.code, message, error);
  }
}

export class ReactionExceedLimitException extends DomainException {
  public static code = ERRORS.REACTION_EXCEED_LIMIT;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Exceed reaction kind limit';
    super(ReactionExceedLimitException.code, message, error);
  }
}

export class ReactionTargetNotExistingException extends DomainException {
  public static code = ERRORS.REACTION_TARGET_NOT_EXISTING;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Unable to find the reaction target';
    super(ReactionTargetNotExistingException.code, message, error);
  }
}

export class ReactionNotHaveAuthorityException extends DomainException {
  public static code = ERRORS.REACTION_NOT_HAVE_AUTHORITY;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.reaction.not_have_authority`) || '';
    super(ReactionNotHaveAuthorityException.code, message, error);
  }
}
