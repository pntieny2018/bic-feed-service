import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';

import { ERRORS } from '../../../../common/constants/errors';
import { DomainForbiddenException, DomainNotFoundException } from '../../../../common/exceptions';

export class QuizNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.QUIZ_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.quiz.not_found`) || '';
    super(QuizNotFoundException.code, message, error);
  }
}

export class QuizOverTimeException extends DomainException {
  public static code = ERRORS.QUIZ_OVER_TIME;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.quiz.over_time`) || '';
    super(QuizOverTimeException.code, message, error);
  }
}

export class QuizNoCRUDPermissionAtGroupException extends DomainForbiddenException {
  public static code = ERRORS.QUIZ_NO_CRUD_PERMISSION_AT_GROUP;

  public constructor(groups: string[] = [], message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message =
      message ||
      i18n?.t(`error.quiz.no_crud_permission_at_group`, { args: { groups: groups.join(', ') } }) ||
      '';

    super(QuizNoCRUDPermissionAtGroupException.code, message, error);
  }
}

export class QuizParticipantNotFoundException extends DomainException {
  public static code = ERRORS.QUIZ_PARTICIPANT_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.quiz_participant.not_found`) || '';
    super(QuizParticipantNotFoundException.code, message, error);
  }
}

export class QuizParticipantNotFinishedException extends DomainException {
  public static code = ERRORS.QUIZ_PARTICIPANT_NOT_FINISHED;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.quiz_participant.not_finished`) || '';
    super(QuizParticipantNotFinishedException.code, message, error);
  }
}

export class QuizQuestionLimitExceededException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.QUIZ_QUESTION_LIMIT_EXCEEDED,
      message || i18n?.t(`error.quiz.quiz_question_limit_exceeded`)
    );
  }
}

export class QuizQuestionNotFoundException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ_QUESTION_NOT_FOUND, message || i18n?.t(`error.quiz_question.not_found`));
  }
}
