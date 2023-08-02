import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../constants/errors';

export class DatabaseException extends DomainException {
  public static code = ERRORS.DATABASE_ERROR;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.common.database_error`) || '';
    super(DatabaseException.code, message, error);
  }
}
