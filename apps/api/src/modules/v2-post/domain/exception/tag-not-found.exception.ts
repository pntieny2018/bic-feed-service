import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class TagNotFoundException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.TAG.TAG_NOT_FOUND, message || i18n.t(`error.tag.not_found`));
  }
}
