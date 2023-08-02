import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Response } from 'express';
import snakecaseKeys from 'snakecase-keys';
import { ResponseDto } from '../dto';
import { ValidatorException } from '../exceptions';
import { DomainException } from '@beincom/domain';
import { ERRORS } from '../constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  public constructor(private _appEnv: string, private _rootPath: string) {}

  public catch(exception: Error, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof ValidatorException) {
      return this.handleValidatorException(exception, response);
    } else if (exception instanceof DomainException) {
      return this.handleLogicException(exception, response);
    } else if (exception instanceof HttpException) {
      return this.handleHttpException(exception, response);
    } else {
      Sentry.captureException(exception);
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
    const res = exception.getResponse();
    let errors = null;
    if (res['errors']) errors = snakecaseKeys(res['errors']);
    if (res['cause']) errors = snakecaseKeys(res['cause']);
    return response.status(status).json(
      new ResponseDto({
        code: res['code'],
        meta: {
          message: exception.message,
          errors,
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
        code: ERRORS.API_SERVER_INTERNAL_ERROR,
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
        code: ERRORS.API_VALIDATION_ERROR,
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
  protected handleLogicException(exception: DomainException, response: Response): Response {
    let status = HttpStatus.BAD_REQUEST;

    switch (exception.code) {
      case ERRORS.TOKEN_EXPIRED:
      case ERRORS.API_UNAUTHORIZED:
        status = HttpStatus.UNAUTHORIZED;
        break;
      case ERRORS.API_FORBIDDEN:
        status = HttpStatus.FORBIDDEN;
        break;
      case ERRORS.API_SERVER_INTERNAL_ERROR:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        break;
    }

    return response.status(status).json(
      new ResponseDto({
        code: exception.code,
        meta: {
          message: exception.message,
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
    if (this._appEnv === 'production') return null;
    const arrayStack = exception.stack.split('\n');
    return arrayStack;
  }
}
