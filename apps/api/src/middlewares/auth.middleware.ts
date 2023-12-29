import { Traceable } from '@libs/common/modules/opentelemetry';
import { IUserService, USER_SERVICE_TOKEN, UserDto } from '@libs/service/user';
import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

import { ERRORS } from '../common/constants';

@Injectable()
@Traceable()
export class AuthMiddleware implements NestMiddleware {
  public constructor(
    @Inject(USER_SERVICE_TOKEN)
    private readonly _userService: IUserService
  ) {}

  public async use(req: Request, res: Response, next: () => void): Promise<void> {
    try {
      if (!req.headers?.user) {
        throw new UnauthorizedException({
          code: ERRORS.API_UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }
      const payload = JSON.parse(req.headers?.user as string);
      const username = payload['cognito:username'];
      req.user = await this._getUser(username);

      next();
    } catch (error) {
      throw new UnauthorizedException({
        code: ERRORS.API_UNAUTHORIZED,
        message: 'Unauthorized',
      });
    }
  }

  private async _getUser(username: string): Promise<UserDto> {
    const userInfo = await this._userService.findByUsername(username);
    if (!userInfo) {
      throw new UnauthorizedException({
        code: ERRORS.API_UNAUTHORIZED,
        message: 'User is not found',
      });
    }
    return userInfo;
  }
}
