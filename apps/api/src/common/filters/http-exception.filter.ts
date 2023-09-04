import { DomainException } from '@beincom/domain';
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { isAxiosError } from '@nestjs/terminus/dist/utils';
import * as Sentry from '@sentry/node';
import { Response } from 'express';
import snakecaseKeys from 'snakecase-keys';

import { ERRORS } from '../constants/errors';
import { ResponseDto } from '../dto';
import {
  ValidatorException,
  DomainForbiddenException,
  DomainNotFoundException,
} from '../exceptions';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  public constructor(private _appEnv: string, private _rootPath: string) {}

  public catch(error: Error, host: ArgumentsHost): Response {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    return this.handleHttpException(this._errorToHttpException(error), response);
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
    if (res['errors']) {
      errors = snakecaseKeys(res['errors']);
    }
    if (res['cause']) {
      errors = snakecaseKeys(res['cause']);
    }

    return response.status(status).json(
      new ResponseDto({
        code: res['code'] || this._getCommonErrorCodeByStatus(status),
        meta: {
          message: exception.message,
          errors,
          stack: this._getStack(exception),
        },
      })
    );
  }

  private _errorToHttpException(error: Error): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    if (isAxiosError(error) && error?.response?.status) {
      const httpStatus = error.response.status;
      const errorResponse = {
        ...error.response?.data,
        message: error.response?.data?.meta?.message ?? 'Internal server error',
        cause: { name: error['config']?.['url'], message: error.message },
      };

      return new HttpException(errorResponse, httpStatus);
    }

    if (error instanceof DomainException) {
      if (error instanceof DomainForbiddenException) {
        return new ForbiddenException(error);
      } else if (error instanceof DomainNotFoundException) {
        return new NotFoundException(error);
      } else {
        return new BadRequestException(error);
      }
    }

    if (error instanceof ValidatorException) {
      error.message = 'Validate fails';
      return new BadRequestException(error);
    }

    error.message = 'Internal server error';
    Sentry.captureException(error);
    return new InternalServerErrorException(error);
  }

  /**
   * Get stack for only development env
   * @param exception HttpException | Error
   * @returns Stack array
   */
  private _getStack(exception: HttpException | Error): string[] {
    if (this._appEnv === 'production') {
      return null;
    }
    const arrayStack = exception.stack.split('\n');
    return arrayStack;
  }

  /**
   * Get common error code by http status
   * @param status number
   * @returns string
   */
  private _getCommonErrorCodeByStatus(status: number): string {
    switch (status) {
      case HttpStatus.NOT_FOUND:
        return ERRORS.API_NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ERRORS.API_VALIDATION_ERROR;
      case HttpStatus.FORBIDDEN:
        return ERRORS.API_FORBIDDEN;
      default:
        return ERRORS.API_SERVER_INTERNAL_ERROR;
    }
  }
}
