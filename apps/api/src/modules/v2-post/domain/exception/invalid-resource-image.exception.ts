import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class InvalidResourceImageException extends DomainException {
  public constructor(message?: string) {
    const i18n = I18nContext.current();
    super(ERRORS.IMAGE_RESOURCE_INVALID, message || i18n?.t(`error.image_resource_invalid`));
  }
}
