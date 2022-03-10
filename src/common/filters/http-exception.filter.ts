import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto';
import { StatusCode } from '../enum';
import { ValidatorException } from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private _appEnv: string, private _rootPath: string) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (response.req.originalUrl === '/') {
      response.redirect(this._rootPath);
    }
    if (exception instanceof ValidatorException) {
      this.handleValidatorException(exception, response);
    } else if (exception instanceof HttpException) {
      this.handleHttpException(exception, response);
    } else {
      this.handleUnKnowException(exception, response);
    }
  }

  /**
   * Handle Nest Http Exception
   * @param exception
   * @param response
   */
  handleHttpException(exception: HttpException, response: Response): void {
    const status = exception.getStatus();
    response.status(status).json(
      new ResponseDto({
        code: status < HttpStatus.INTERNAL_SERVER_ERROR ? StatusCode.BAD_REQUEST : StatusCode.INTERNAL_SERVER_ERROR,
        meta: {
          message: exception.message,
          stack: this._getStack(exception),
        },
      })
    );
  }

  /**
   * Handle UnKnow Exception
   * @param exception
   * @param response
   */
  public handleUnKnowException(exception: Error, response: Response): void {
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
      new ResponseDto({
        code: StatusCode.INTERNAL_SERVER_ERROR,
        meta: {
          message: exception['message'],
          stack: this._getStack(exception),
        },
      })
    );
  }

  /**
   * Handle ValidatorException
   * @param exception
   * @param response
   */
  public handleValidatorException(exception: ValidatorException, response: Response): void {
    response.status(HttpStatus.BAD_REQUEST).json(
      new ResponseDto({
        code: StatusCode.BAD_REQUEST,
        meta: {
          message: response?.responseMessage?.validator?.fails || 'Validate fails',
          errors: exception.getResponse(),
          stack: this._getStack(exception),
        },
      })
    );
  }

  /**
   * Get stack for only development env
   * @param exception HttpException | Error
   * @returns Stack array
   */
  private _getStack(exception: HttpException | Error): string[] {
    const arrayStack = exception.stack.split('\n');
    return this._appEnv === 'development' ? arrayStack : null;
  }
}
