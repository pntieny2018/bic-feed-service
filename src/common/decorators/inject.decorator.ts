import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { InjectUserInterceptor } from '../interceptors/user.interceptor';

export function InjectUserToQuery(): MethodDecorator {
  return applyDecorators(InjectUserTo('query'));
}

export function InjectUserToBody(): MethodDecorator {
  return applyDecorators(InjectUserTo('body'));
}

export function InjectUserToParam(): MethodDecorator {
  return applyDecorators(InjectUserTo('params'));
}

export function InjectUserTo(context: 'query' | 'body' | 'params'): MethodDecorator {
  // return applyDecorators(
  //   UseInterceptors(new InjectUserInterceptor(context), UsePipes(StripRequestContextPipe))
  // );
  return applyDecorators(UseInterceptors(new InjectUserInterceptor(context)));
}
