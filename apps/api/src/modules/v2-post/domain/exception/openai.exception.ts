import { DomainException } from '@beincom/domain';
import { ERRORS } from '../../../../common/constants/errors';

export class OpenAIException extends DomainException {
  public static code = ERRORS.OPENAI_EXCEPTION;

  public constructor(message: string = null, error: any = null) {
    message = message || 'OpenAI exception';
    super(OpenAIException.code, message, error);
  }
}
