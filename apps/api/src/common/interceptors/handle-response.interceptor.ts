import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response, Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { map, Observable } from 'rxjs';
import snakecaseKeys from 'snakecase-keys';

import { ERRORS } from '../constants/errors';
import { ResponseDto } from '../dto';

@Injectable()
export class HandleResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    const i18n = I18nContext.current();
    const response: Response = context.switchToHttp().getResponse();
    const request: Request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        let message = 'OK';
        if (response.responseMessage) {
          message = response.responseMessage.success;
        }
        if (request.message) {
          message = request.message;
        }
        return {
          code: ERRORS.API_OK,
          data:
            typeof data === 'object'
              ? snakecaseKeys(data, {
                  exclude: [
                    /[\-]/gm,
                    /[\.]/gm,
                    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
                  ],
                })
              : data,
          meta: {
            message: i18n?.translate(message),
          },
        };
      })
    );
  }
}
