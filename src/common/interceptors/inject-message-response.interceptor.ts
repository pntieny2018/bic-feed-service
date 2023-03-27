import { Observable } from 'rxjs';
import { Response } from 'express';
import { IResponseMessage } from '../extension';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

/**
 * Inject message of action to response
 */
export class InjectMessageResponseInterceptor implements NestInterceptor {
  public constructor(private _messages: IResponseMessage) {}
  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response: Response = context.switchToHttp().getResponse();

    response.responseMessage = {
      ...this._messages,
    };
    return next.handle();
  }
}
