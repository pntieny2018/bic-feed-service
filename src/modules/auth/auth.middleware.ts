import { Request } from 'express';
import { AuthService } from './auth.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public constructor(private _authService: AuthService) {}

  public async use(req: Request, res: Response, next: () => void): Promise<void> {
    if (req.headers?.user) {
      const payload = JSON.parse(req.headers?.user as string);

      req.user = await this._authService.getUser(payload);
    } else if (req.headers?.secret) {
      // temp for push to build new version app
      req.user = await this._authService.getUser({
        email: 'bicbot@maildrop.cc',
        ['cognito:username']: 'bot',
        ['custom:user_uuid']: req.headers.bot_id,
        ['custom:bein_staff_role']: 'BOT',
      });
    } else {
      req.user = null;
      const token = req.headers.authorization;
      if (
        !token &&
        req.baseUrl.indexOf('comments/') !== -1 &&
        req.baseUrl.indexOf('posts/') !== -1
      ) {
        throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
      }
      req.user = token ? await this._authService.login(token) : null;
    }

    // const token = req.headers.authorization;
    //
    // if (!token && req.baseUrl.indexOf('comments/') !== -1 && req.baseUrl.indexOf('posts/') !== -1) {
    //   throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
    // }
    // req.user = token ? await this._authService.login(token) : null;
    next();
  }
}
