import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../constants/errors';

export class DatabaseException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.DATABASE_ERROR, message || i18n?.t('error.common.database_error'));
  }
}
