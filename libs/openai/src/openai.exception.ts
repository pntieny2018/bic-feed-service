import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../apps/api/src/common/constants/errors';

export class OpenAIException extends Error {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ.QUIZ_NO_CRUD_PERMISSION_AT_GROUP);
  }
}

export class CountTokenException extends Error {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ.COUNT_TOKENS_FAILED);
  }
}
