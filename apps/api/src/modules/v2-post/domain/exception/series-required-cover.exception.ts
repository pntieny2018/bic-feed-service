import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class SeriesRequiredCoverException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.SERIES.SERIRES_REQUIRED_COVER, message || i18n.t(`error.series.required_cover`));
  }
}
