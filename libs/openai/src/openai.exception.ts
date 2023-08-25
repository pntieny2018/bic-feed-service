import { I18nContext } from 'nestjs-i18n';

import { ERRORS } from '../../../apps/api/src/common/constants/errors';

export class CountTokenException extends Error {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.QUIZ_COUNT_TOKENS_FAILED);
  }
}
