import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class InvalidResourceImageException extends DomainException {
  public static code = ERRORS.IMAGE_RESOURCE_INVALID;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.image_resource_invalid`) || '';
    super(InvalidResourceImageException.code, message, error);
  }
}
