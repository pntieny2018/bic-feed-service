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
import { ClassTransformer } from 'class-transformer';
import { LogicException } from '../../common/exceptions';
import { HTTP_STATUS_ID } from '../../common/constants';

@Injectable()
export class AuthService {
  private _logger = new Logger(AuthService.name);
  private _classTransformer = new ClassTransformer();

  public constructor(
    private _userService: UserService,
    private _httpService: HttpService,
    private _configService: ConfigService
  ) {}

  public async getUser(payload: Record<string, any>): Promise<UserDto> {
    // const user = this._classTransformer.plainToInstance(UserDto, {
    //   email: payload['email'],
    //   username: payload['cognito:username'],
    //   id: payload['custom:user_uuid'],
    //   staffRole: payload['custom:bein_staff_role'],
    // });
    // user.profile = await this._userService.get(user.id);
    // user.permissions = await this._userService.getPermissions(user.id, JSON.stringify(payload));
    // if (!user.profile) {
    //   throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
    // }
    // user.avatar = user.profile.avatar;

    const user = this._classTransformer.plainToInstance(UserDto, {
      email: payload['email'],
      username: payload['cognito:username'],
      id: '',
      staffRole: payload['custom:bein_staff_role'],
    });

    user.profile = await this._userService.getByValue(user.username);
    if (!user.profile) {
      throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
    }
    user.id = user.profile.id;
    user.avatar = user.profile.avatar;

    return user;
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
      throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
    }
    let payload;

    try {
      payload = await jwt.verify(token, pem);
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        throw new LogicException(HTTP_STATUS_ID.APP_AUTH_TOKEN_EXPIRED);
      }
      throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
    }

    if (!payload) {
      throw new LogicException(HTTP_STATUS_ID.API_UNAUTHORIZED);
    }

    return this.getUser(payload);
  }
}
