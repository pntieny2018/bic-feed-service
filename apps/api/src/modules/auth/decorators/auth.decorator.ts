import { Request } from 'express';
import { HTTP_STATUS_ID } from '../../../common/constants';
import { LogicException } from '../../../common/exceptions';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * AuthUser decorator resolve auth user info
 */
export const AuthUser = createParamDecorator((required = true, ctx: ExecutionContext) => {
  const request: Request = ctx.switchToHttp().getRequest();
  if (!request.user && required) {
    throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
  }
  return request.user;
});
