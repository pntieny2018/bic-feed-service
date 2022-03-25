import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { authInput, userInfoExpect, cognitoKeys, payLoad } from './mocks';
import { UserDto } from '../dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AxiosResponse } from 'axios';
import jwt from 'jsonwebtoken';
import { UserService } from '../../../shared/user';

const httpServiceMock = {
  get: (): Observable<any> => {
    return new Observable<AxiosResponse>((subscriber) => {
      subscriber.next({
        data: { keys: cognitoKeys },
        config: null,
        headers: null,
        status: null,
        statusText: null,
      });
      subscriber.complete();
    });
  },
};

const configServiceMock = {
  get: (): object => ({
    region: 'vn',
    poolId: 1,
  }),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('AuthService should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('function - login - verify token', () => {
    describe('invalid token', () => {
      describe('null token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login(authInput.nullToken);
          } catch (e) {
            expect(e).toBeInstanceOf(UnauthorizedException);
            expect((e as UnauthorizedException).message).toEqual('Unauthorized');
          }
        });
      });

      describe('undefine token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login(undefined);
          } catch (e) {
            expect(e).toBeInstanceOf(UnauthorizedException);
          }
        });
      });

      describe('empty token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login('');
          } catch (e) {
            expect(e).toBeInstanceOf(UnauthorizedException);
          }
        });
      });

      describe('fake token', () => {
        it('should throw an UnauthorizedException', async () => {
          try {
            await authService.login(authInput.tokenInvalid);
          } catch (e) {
            expect(e).toBeInstanceOf(UnauthorizedException);
          }
        });
      });

      describe('expired token', () => {
        it('should throw an UnauthorizedException', async () => {
          jest.spyOn(jwt, 'verify').mockImplementation(() => {
            throw new jwt.TokenExpiredError('Token Expired Error', new Date());
          });
          try {
            await authService.login(authInput.expiredToken);
          } catch (e) {
            expect(e).toBeInstanceOf(UnauthorizedException);
            expect((e as UnauthorizedException).message).toEqual('Auth token expired');
          }
        });
      });
    });

    describe('valid token', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => payLoad);

      it('should return the user data', async () => {
        const user: UserDto = await authService.login(authInput.tokenValid);
        expect(user).toEqual(userInfoExpect);
      });
    });
  });
});
