import { Observable } from 'rxjs';
import { Response } from 'express';
import { IResponseMessage } from '../extension';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';

/**
 * Inject message of action to response
 */
export class InjectMessageResponseInterceptor implements NestInterceptor {
  constructor(private _messages: IResponseMessage) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response: Response = context.switchToHttp().getResponse();
    response.responseMessage = this._messages;
    return next.handle();
  }
}
