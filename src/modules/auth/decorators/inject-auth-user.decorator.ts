import { applyDecorators, UseInterceptors, UsePipes } from '@nestjs/common';
import { ContextType, InjectRequestScopeInterceptor } from '../interceptors';
import { RemoveRequestScopePipe } from '../pipes';

function InjectAuthUserTo(context: ContextType): MethodDecorator {
  return applyDecorators(UseInterceptors(new InjectRequestScopeInterceptor(context)), UsePipes(RemoveRequestScopePipe));
}

export function InjectAuthUserToQuery(): MethodDecorator {
  return applyDecorators(InjectAuthUserTo(ContextType.query));
}

export function InjectAuthUserToBody(): MethodDecorator {
  return applyDecorators(InjectAuthUserTo(ContextType.body));
}

export function InjectAuthUserToParam(): MethodDecorator {
  return applyDecorators(InjectAuthUserTo(ContextType.params));
}
