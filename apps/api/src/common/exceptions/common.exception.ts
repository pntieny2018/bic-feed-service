import { DomainException } from '@beincom/domain';
import { ERRORS } from '../constants';

export class DomainForbiddenException extends DomainException {
  public static code = ERRORS.API_FORBIDDEN;

  public constructor(
    code: string = DomainForbiddenException.code,
    message: string = null,
    error: any = null
  ) {
    message = message || 'Unable to perform this action';
    super(code, message, error);
  }
}

export class DomainNotFoundException extends DomainException {
  public static code = ERRORS.API_NOT_FOUND;

  public constructor(
    code: string = DomainNotFoundException.code,
    message: string = null,
    error: any = null
  ) {
    message = message || 'Resource not found';
    super(code, message, error);
  }
}

export class ServerInternalException extends DomainException {
  public static code = ERRORS.API_SERVER_INTERNAL_ERROR;

  public constructor(message: string = null, error: any = null) {
    message = message || 'Server internal error';
    super(ServerInternalException.code, message, error);
  }
}
