import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../common/constants/errors';

export class TagUsedException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.tag.TAG_IS_USED, message || i18n.t(`error.${ERRORS.tag.TAG_IS_USED}`));
  }
}
