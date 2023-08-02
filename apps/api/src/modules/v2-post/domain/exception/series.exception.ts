import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';
import { DomainNotFoundException } from '../../../../common/exceptions';

export class SeriesNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.SERIES_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Unable to find the series';
    super(SeriesNotFoundException.code, message, error);
  }
}

export class SeriesRequiredCoverException extends DomainException {
  public static code = ERRORS.SERIES_REQUIRED_COVER;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.series.required_cover`) || '';
    super(SeriesRequiredCoverException.code, message, error);
  }
}
