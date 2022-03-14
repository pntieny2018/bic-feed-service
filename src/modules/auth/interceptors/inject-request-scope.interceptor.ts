import { CallHandler, ExecutionContext, NestInterceptor, Logger } from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';

export const REQUEST_CONTEXT = '_requestContext';

export enum ContextType {
  query = 'query',
  body = 'body',
  params = 'params',
}

export class InjectRequestScopeInterceptor implements NestInterceptor {
  public constructor(private _type: ContextType) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();

    if (request[this._type] && (request.user || request.path)) {
      request[this._type][REQUEST_CONTEXT] = {};
      if (request.user) {
        request[this._type][REQUEST_CONTEXT].user = request.user;
      }

      if (request.path) {
        request[this._type][REQUEST_CONTEXT].path = request.path;
      }
    }
    return next.handle();
  }
}
