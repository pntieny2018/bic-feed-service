import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';
import { DomainNotFoundException } from '../../../../common/exceptions';

export class RecentSearchNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.RECENT_SEARCH_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.recent_search.not_found`) || '';
    super(RecentSearchNotFoundException.code, message, error);
  }
}
