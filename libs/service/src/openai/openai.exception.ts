import { ERRORS } from 'apps/api/src/common/constants/errors';
import { I18nContext } from 'nestjs-i18n';

export class OpenAIException extends Error {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ.QUIZ_NO_CRUD_PERMISSION_AT_GROUP);
  }
}
