import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto';
import { map, Observable } from 'rxjs';
import { HTTP_STATUS_ID } from '../constants';

@Injectable()
export class HandleResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    const response: Response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        let message = 'OK';
        if (response.responseMessage) {
          message = response.responseMessage.success;
        }
        return {
          code: HTTP_STATUS_ID.API_OK,
          data,
          meta: {
            message: message,
          },
        };
      })
    );
  }
}
