import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response, Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { map, Observable } from 'rxjs';

import { ERRORS } from '../constants/errors';
import { ResponseDto } from '../dto';
import semver from 'semver';
import { MINIMUM_VERSION_SUPPORT, VERSION_1_13_0 } from '@api/common/constants';
import snakecaseKeys from 'snakecase-keys';

@Injectable()
export class HandleResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    const i18n = I18nContext.current();
    const response: Response = context.switchToHttp().getResponse();
    const request: Request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        const version = request.header('x-version-id');
        //return data;
        let message = 'OK';
        if (response.responseMessage) {
          message = response.responseMessage.success;
        }
        if (request.message) {
          message = request.message;
        }
        if (semver.lte(version, VERSION_1_13_0)) {
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
              message: message === 'OK' ? message : i18n?.translate(message),
            },
          };
        } else {
          return {
            code: ERRORS.API_OK,
            data,
            meta: {
              message: message === 'OK' ? message : i18n?.translate(message),
            },
          };
        }
      })
    );
  }
}
