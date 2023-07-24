import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../common/constants/errors';

export class RecentSearchNotFoundException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.RECENT_SEARCH.RECENT_SEARCH_NOT_FOUND,
      message || i18n?.t(`error.recent_search.not_found`)
    );
  }
}
