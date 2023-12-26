import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response, Request } from 'express';
import { ResponseDto } from '../dto';
import { map, Observable } from 'rxjs';
import snakecaseKeys from 'snakecase-keys';
import { ERRORS } from '../constants/errors';
import { I18nContext } from 'nestjs-i18n';

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
                  exclude: [/[\-]/gm, /[\.]/gm],
                })
              : data,
          meta: {
            message: message === 'OK' ? message : i18n?.translate(message),
          },
        };
      })
    );
  }
}
