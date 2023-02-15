import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Response } from 'express';
import { I18n, I18nContext, I18nService } from 'nestjs-i18n';
import snakecaseKeys from 'snakecase-keys';
import { HTTP_MESSAGES, HTTP_STATUS_ID } from '../constants';
import { ResponseDto } from '../dto';
import { LogicException, ValidatorException } from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  public constructor(private _appEnv: string, private _rootPath: string) {}

  public catch(exception: Error, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception instanceof ValidatorException) {
      console.log('handleValidatorException');
      return this.handleValidatorException(exception, response);
    } else if (exception instanceof HttpException) {
      console.log('handleHttpException');
      return this.handleHttpException(exception, response);
    } else {
      console.log('handleUnKnowException');
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
    return response.status(status).json(
      new ResponseDto({
        code: res['code'],
        meta: {
          message: exception.message,
          errors: res['errors'] ? snakecaseKeys(res['errors']) : null,
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
        code: HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR,
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
        code: HTTP_STATUS_ID.API_VALIDATION_ERROR,
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
    let status = HttpStatus.BAD_REQUEST;

    switch (exception.id) {
      case HTTP_STATUS_ID.APP_AUTH_TOKEN_EXPIRED:
      case HTTP_STATUS_ID.API_UNAUTHORIZED:
        status = HttpStatus.UNAUTHORIZED;
        break;
      case HTTP_STATUS_ID.API_FORBIDDEN:
        status = HttpStatus.FORBIDDEN;
        break;
      case HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        break;
    }

    return response.status(status).json(
      new ResponseDto({
        code: exception.id,
        meta: {
          message: HTTP_MESSAGES[exception.id],
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
