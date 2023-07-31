import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class PostLimitAttachedSeriesException extends DomainException {
  public constructor(limitNumber?: number) {
    const i18n = I18nContext.current();
    super(
      ERRORS.POST.POST_LIMIT_ATTACHED_SERIES,
      i18n?.t(`error.post.limit_attached_series`, {
        args: { limit: limitNumber },
      })
    );
  }
}
