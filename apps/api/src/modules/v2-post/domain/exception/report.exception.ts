import { DomainException } from '@beincom/domain';

import { ERRORS } from '../../../../common/constants';

export class ReportOwnContentException extends DomainException {
  public static code = ERRORS.REPORT_OWN_CONTENT;

  public constructor(message: string = null, error: any = null) {
    message = message || 'You cant not report yourself';
    super(ReportOwnContentException.code, message, error);
  }
}
