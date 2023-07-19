import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class QuizGenerationLimitException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ.GENERATE_LIMITED, message || i18n?.t(`error.quiz.generate_limited`));
  }
}
