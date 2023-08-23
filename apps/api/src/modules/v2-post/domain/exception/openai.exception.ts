import { DomainException } from '@beincom/domain';
import { ERRORS } from '../../../../common/constants/errors';

export class OpenAIException extends DomainException {
  public constructor(message?: string) {
    super(ERRORS.QUIZ.OPENAI_EXCEPTION, message);
  }
}
