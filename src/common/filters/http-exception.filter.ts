import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto';
import { StatusCode } from '../enum';
import { LogicException, ValidatorException } from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  public constructor(private _appEnv: string, private _rootPath: string) {}

  public catch(exception: Error, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof ValidatorException) {
      return this.handleValidatorException(exception, response);
    } else if (exception instanceof LogicException) {
      return this.handleLogicException(exception, response);
    } else if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response);
    } else {
      return this.handleUnKnowException(exception, response);
    }
  }

  /**
   * Handle Nest Http Exception
   * @param exception
   * @param response
   */
  protected handleHttpException(exception: HttpException, response: Response): Response {
    const status = exception.getStatus();
    let code = StatusCode.INTERNAL_SERVER_ERROR;

    if (status < HttpStatus.INTERNAL_SERVER_ERROR) {
      code = StatusCode.BAD_REQUEST;
    }
    return response.status(status).json(
      new ResponseDto({
        code: code,
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
  protected handleUnKnowException(exception: Error, response: Response): Response {
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
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
  protected handleValidatorException(exception: ValidatorException, response: Response): Response {
    let message = 'Validate fails';

    if (response.responseMessage && response.responseMessage.validator) {
      message = response.responseMessage.validator.fails;
    }
    return response.status(HttpStatus.BAD_REQUEST).json(
      new ResponseDto({
        code: StatusCode.BAD_REQUEST,
        meta: {
          message: message,
          errors: exception.getResponse(),
          stack: this._getStack(exception),
        },
      })
    );
  }

  /**
   * Handle LogicException
   * @param exception
   * @param response
   */
  protected handleLogicException(exception: LogicException, response: Response): Response {
    return response.status(HttpStatus.BAD_REQUEST).json(
      new ResponseDto({
        code: StatusCode.BAD_REQUEST,
        meta: {
          message: exception.id,
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
    if (this._appEnv === 'development') {
      return arrayStack;
    }
    return null;
  }
}
