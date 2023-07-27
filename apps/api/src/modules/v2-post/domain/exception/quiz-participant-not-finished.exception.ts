import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class QuizParticipantNotFinishedException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.QUIZ_PARTICIPANT.NOT_FINISHED,
      message || i18n?.t(`error.quiz_participant.not_finished`)
    );
  }
}
