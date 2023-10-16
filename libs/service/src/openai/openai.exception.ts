import { ERRORS } from '../../../../apps/api/src/common/constants';

export class CountTokenException extends Error {
  public constructor() {
    super(ERRORS.QUIZ_COUNT_TOKENS_FAILED);
  }
}
