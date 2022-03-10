import { UserDto } from '../../modules/auth';

export interface IResponseMessage {
  validator?: {
    fails: string;
  };
  success: string;
  forbidden?: string;
}

declare module 'express-serve-static-core' {
  /**
   * Extend the Request interface of express-serve-static-common module.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Request {
    user: UserDto;
  }

  /**
   * Extend the Response interface of express-serve-static-common module.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Response {
    responseMessage?: IResponseMessage;
  }
}
