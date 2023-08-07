import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class TagSeriesInvalidException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.TAG_SERIES_INVALID, message || i18n?.t(`error.tag_series_invalid`), errors);
  }
}
