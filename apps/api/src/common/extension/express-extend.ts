import { UserDto } from '../../modules/v2-user/application';

export interface IResponseMessage {
  success: string;
  error?: string;
}

declare module 'express-serve-static-core' {
  /**
   * Extend the Request interface of express-serve-static-common module.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Request {
    user: UserDto;
    message?: string;
  }

  /**
   * Extend the Response interface of express-serve-static-common module.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Response {
    responseMessage?: IResponseMessage;
  }
}
