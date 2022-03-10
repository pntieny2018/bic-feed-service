import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * AuthUser decorator resolve auth user info
 */
export function AuthUser(): ParameterDecorator {
  return createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return request.user;
  });
}
