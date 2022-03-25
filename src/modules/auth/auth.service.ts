import { UserDto } from './dto';
import jwkToPem from 'jwk-to-pem';
import * as jwt from 'jsonwebtoken';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ICognitoConfig } from '../../config/cognito';
import { TokenExpiredError } from 'jsonwebtoken';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../shared/user';

@Injectable()
export class AuthService {
  private _logger = new Logger(AuthService.name);
  public constructor(
    private _userService: UserService,
    private _httpService: HttpService,
    private _configService: ConfigService
  ) {}

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
      throw new UnauthorizedException('Unauthorized');
    }
    try {
      const payload = await jwt.verify(token, pem);
      const user = new UserDto({
        email: payload['email'],
        username: payload['custom:username'],
        id: parseInt(payload['custom:bein_user_id']),
        staffRole: payload['custom:bein_staff_role'],
      });
      user.profile = await this._userService.get(user.id);
      return user;
    } catch (e) {
      this._logger.error(e, e?.stack);
      const message = e instanceof TokenExpiredError ? 'Auth token expired' : 'Unauthorized';
      throw new UnauthorizedException(message);
    }
  }
}
