import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';
import { ERRORS } from '../../../../common/constants/errors';

export class ContentHasBeenPublishedException extends DomainException {
  public constructor(errors?: any, message?: string) {
    const i18n = I18nContext.current();
    super(
      ERRORS.CONTENT.CONTENT_HAS_BEEN_PUBLISHED,
      message || i18n?.t(`error.content.has_been_published'`),
      errors
    );
  }
}
