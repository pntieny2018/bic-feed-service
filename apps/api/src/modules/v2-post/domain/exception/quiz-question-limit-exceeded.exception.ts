import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class QuizQuestionLimitExceededException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.QUIZ.QUIZ_QUESTION_LIMIT_EXCEEDED,
      message || i18n?.t(`error.quiz.quiz_question_limit_exceeded`)
    );
  }
}
