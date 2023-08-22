import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class QuizQuestionNotFoundException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ_QUESTION.NOT_FOUND, message || i18n?.t(`error.quiz_question.not_found`));
  }
}
