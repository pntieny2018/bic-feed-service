import { Request } from 'express';
import { AuthService } from './auth.service';
import { HTTP_STATUS_ID } from '../../common/constants';
import { LogicException } from '../../common/exceptions';
import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public constructor(private _authService: AuthService) {}

  public async use(req: Request, res: Response, next: () => void): Promise<void> {
    const token = req.headers.authorization;
    if (!token) {
      throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
    }
    req.user = await this._authService.login(token);
    next();
  }
}
