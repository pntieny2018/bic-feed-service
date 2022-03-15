import { Request } from 'express';
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * AuthUser decorator resolve auth user info
 */
export const AuthUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest();
  if (!request.user) {
    throw new UnauthorizedException();
  }
  return request.user;
});
