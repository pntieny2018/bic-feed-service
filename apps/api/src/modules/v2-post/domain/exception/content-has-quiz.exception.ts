import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ContentHasQuizException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.CONTENT.HAS_QUIZ, message || i18n.t(`error.content.has_quiz`));
  }
}
