import { IUserService, USER_SERVICE_TOKEN } from '@libs/service/user';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { lastValueFrom } from 'rxjs';

import { ERRORS } from '../common/constants';
import { ICognitoConfig } from '../config/cognito';
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
      let username: string;

      if (req.headers?.user) {
        const payload = JSON.parse(req.headers?.user as string);
        username = payload['cognito:username'];
      } else {
        const token = req.headers.authorization;
        username = await this.validateAccessToken(token);
      }

      req.user = await this._getUser(username);

      next();
    } catch (error) {
      throw new UnauthorizedException({
        code: ERRORS.API_UNAUTHORIZED,
        message: 'Unauthorized',
      });
    }
  }

  private async validateAccessToken(token: string): Promise<string> {
    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) {
      throw new UnauthorizedException({
        code: ERRORS.API_UNAUTHORIZED,
        message: 'Not a valid JWT token',
      });
    }

    const cognitoConfig = this._configService.get<ICognitoConfig>('cognito');
    const tokenValidationUrl = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.poolId}/.well-known/jwks.json`;
    // TODO: change to HttpAdapter
    const response = await lastValueFrom(this._httpService.get(tokenValidationUrl));
    const keys = response['data']['keys'];
    const pems = keys
      .map((key) => {
        const keyId = key.kid;
        const modulus = key.n;
        const exponent = key.e;
        const keyType = key.kty;
        const jwk = { kty: keyType, n: modulus, e: exponent };
        return {
          [keyId]: jwkToPem(jwk),
        };
      })
      .reduce((obj, item) => ({ ...obj, ...item }), {});

    const kid = decodedJwt['header']['kid'];
    const pem = pems[kid];
    if (!pem) {
      throw new UnauthorizedException({ code: ERRORS.API_UNAUTHORIZED, message: 'Invalid pem' });
    }

    let payload;
    try {
      payload = await jwt.verify(token, pem);
    } catch (e) {
      if (e instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException({
          code: ERRORS.TOKEN_EXPIRED,
          message: 'Auth token expired',
        });
      }
      throw new UnauthorizedException({ code: ERRORS.API_UNAUTHORIZED, message: e.message });
    }

    if (!payload) {
      throw new UnauthorizedException({
        code: ERRORS.API_UNAUTHORIZED,
        message: 'Invalid payload',
      });
    }

    return payload['cognito:username'];
  }

  private async _getUser(username: string): Promise<UserDto> {
    const userInfo = await this._userService.findByUserName(username);
    if (!userInfo) {
      throw new UnauthorizedException({
        code: ERRORS.API_UNAUTHORIZED,
        message: 'User is not found',
      });
    }
    return userInfo;
  }
}
