import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { ResponseDto } from '../dto';
import { StatusCode } from '../enum';
import { map, Observable } from 'rxjs';

@Injectable()
export class HandleResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    const response: Response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        return {
          code: StatusCode.OK,
          data: data,
          meta: {
            message: response?.responseMessage?.success || 'OK',
          },
        };
      })
    );
  }
}
