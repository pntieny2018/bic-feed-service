import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class TagDuplicateNameException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.TAG.TAG_DUPLICATE_NAME, message || i18n?.t(`error.tag.duplicate_name`));
  }
}
