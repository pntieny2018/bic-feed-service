import jwkToPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';
import { TokenExpiredError } from 'jsonwebtoken';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ICognitoConfig } from '../../config/cognito';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {} from '../../common/exceptions';
import { ERRORS } from '../../common/constants';
import { IUserApplicationService, USER_APPLICATION_TOKEN, UserDto } from '../v2-user/application';

@Injectable()
export class AuthService {
  public constructor(
    @Inject(USER_APPLICATION_TOKEN)
    private _userAppService: IUserApplicationService,
    private _httpService: HttpService,
    private _configService: ConfigService
  ) {}

  public async getUser(payload: Record<string, any>): Promise<UserDto> {
    const username = payload['cognito:username'];
    const userInfo = await this._userAppService.findByUserName(username, {
      withGroupJoined: true,
      withPermission: true,
    });
    if (!userInfo) {
      throw new UnauthorizedException(ERRORS.API_UNAUTHORIZED);
    }
    return userInfo;
  }

  public async login(token: string): Promise<UserDto> {
    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) {
      throw new UnauthorizedException('Unauthorized');
    }

    const cognitoConfig = this._configService.get<ICognitoConfig>('cognito');
    const tokenValidationUrl = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.poolId}/.well-known/jwks.json`;
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
      throw new UnauthorizedException(ERRORS.API_UNAUTHORIZED);
    }
    let payload;

    try {
      payload = await jwt.verify(token, pem);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new UnauthorizedException(ERRORS.TOKEN_EXPIRED);
      }
      throw new UnauthorizedException(ERRORS.API_UNAUTHORIZED);
    }

    if (!payload) {
      throw new UnauthorizedException(ERRORS.API_UNAUTHORIZED);
    }

    return this.getUser(payload);
  }
}
