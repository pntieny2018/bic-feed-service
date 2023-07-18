import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class SeriesNoReadPermissionException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.SERIES.SERIES_NO_READ_PERMISSION,
      message || i18n?.t(`error.series.no_read_permission`)
    );
  }
}
