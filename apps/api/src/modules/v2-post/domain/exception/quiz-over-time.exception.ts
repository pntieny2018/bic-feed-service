import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class QuizOverTimeException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ.QUIZ_OVER_TIME, message || i18n?.t(`error.quiz.over_time`));
  }
}
