import { DomainException } from '@beincom/domain';
import { I18nContext } from 'nestjs-i18n';

import { ERRORS } from '../../../../common/constants';
import { DomainNotFoundException } from '../../../../common/exceptions';

export class ReportOwnContentException extends DomainException {
  public static code = ERRORS.REPORT_OWN_CONTENT;

  public constructor(message: string = null, error: any = null) {
    message = message || 'You cant not report yourself';
    super(ReportOwnContentException.code, message, error);
  }
}

export class NotGroupAdminException extends DomainException {
  public static code = ERRORS.REPORT_NOT_GROUP_ADMIN;

  public constructor(message: string = null, error: any = null) {
    message = message || 'You are not group admin';
    super(NotGroupAdminException.code, message, error);
  }
}

export class ReportNotFoundException extends DomainNotFoundException {
  public static code = ERRORS.REPORT_NOT_FOUND;

  public constructor(message: string = null, error: any = null) {
    const i18n = I18nContext.current();
    message = message || i18n?.t(`error.content.not_found`) || '';
    super(ReportNotFoundException.code, message, error);
  }
}
