import { IResponseMessage } from '../extension';
import { InjectMessageResponseInterceptor } from '../interceptors';
import { applyDecorators, UseInterceptors } from '@nestjs/common';

export function ResponseMessages(messages: IResponseMessage): MethodDecorator {
  return applyDecorators(
    UseInterceptors(new InjectMessageResponseInterceptor(messages))
  );
}
