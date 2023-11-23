import { IUserService, USER_SERVICE_TOKEN } from '@libs/service/user';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { lastValueFrom } from 'rxjs';

import { ERRORS } from '../common/constants';
import { UserDto } from '../modules/v2-user/application';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public constructor(
    private readonly _configService: ConfigService,
    private readonly _httpService: HttpService,
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
    const userInfo = await this._userService.findProfileAndPermissionByUsername(username);
    if (!userInfo) {
      throw new UnauthorizedException({
        code: ERRORS.API_UNAUTHORIZED,
        message: 'User is not found',
      });
    }
    return userInfo;
  }
}
