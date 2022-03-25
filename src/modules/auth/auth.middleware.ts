import { Request } from 'express';
import { AuthService } from './auth.service';
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public constructor(private _authService: AuthService) {}

  public async use(req: Request, res: Response, next: () => void): Promise<void> {
    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }
    req.user = await this._authService.login(token);
    next();
  }
}
