import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ReactionDuplicateException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.REACTION.REACTION_DUPLICATE, message || i18n?.t('error.reaction.duplicate'));
  }
}
