import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ContentLimitAttachedSeriesException extends DomainException {
  public constructor(limitNumber?: number) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.CONTENT_LIMIT_ATTACHED_SERIES,
      i18n.t(`error.content.limit_attached_series`, {
        args: { limit: limitNumber },
      })
    );
  }
}
