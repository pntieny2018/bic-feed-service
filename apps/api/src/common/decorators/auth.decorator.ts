import { Request } from 'express';
import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ERRORS } from '../constants';

/**
 * AuthUser decorator resolve auth user info
 */
export const AuthUser = createParamDecorator((required = true, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest();
  if (!request.user && required) {
    throw new UnauthorizedException({
      code: ERRORS.API_UNAUTHORIZED,
      message: 'Request user is required',
    });
  }
  return request.user;
});
