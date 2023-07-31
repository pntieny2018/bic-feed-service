import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class OpenAIException extends Error {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ.QUIZ_NO_CRUD_PERMISSION_AT_GROUP);
  }
}
