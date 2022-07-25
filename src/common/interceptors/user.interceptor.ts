import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

export const REQUEST_CONTEXT = '_requestContext';

@Injectable()
export class InjectUserInterceptor implements NestInterceptor {
  public constructor(private _type?: 'query' | 'body' | 'params') {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (this._type && request[this._type]) {
      request[this._type][REQUEST_CONTEXT] = {
        user: request.user,
        token: request.headers.authorization,
        userPayload: request.headers.user,
      };
    }

    return next.handle();
  }
}
