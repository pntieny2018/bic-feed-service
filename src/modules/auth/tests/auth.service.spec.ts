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
import { SentryService } from '@app/sentry';
import { LogicException } from '../../../common/exceptions';
import { HTTP_STATUS_ID } from '../../../common/constants';

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
  let userService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            get: jest.fn(),
            getPermissions: jest.fn()
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
        {
          provide: SentryService,
          useValue: {
            captureException: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
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

      describe('undefined token', () => {
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
            expect(e).toBeInstanceOf(LogicException);
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
            expect(e).toBeInstanceOf(LogicException);
            expect((e as UnauthorizedException).message).toEqual(HTTP_STATUS_ID.APP_AUTH_TOKEN_EXPIRED);
          }
        });
      });
    });
    describe('valid token', () => {
      it('should return the user data', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => payLoad);
        userService.get.mockResolvedValue({
          id: '42d8ea55-8f73-44b4-9f7d-3434e1dd0de0',
          username: 'tronghm',
          fullname: 'Hoàng Minh Trọng',
          avatar:
            'https://bein-development-storage.s3.ap-southeast-1.amazonaws.com/public/a/f9/af95058bbbc7ace1630495801f5b8694.JPG',
          groups: ['72cf4230-d641-4479-93e6-2b58828a07a6', '8c846fe3-a615-42ae-958a-33a43d24a033'],
        });

        const user = await authService.login(authInput.tokenValid);
        expect(user).toBeInstanceOf(UserDto);
        expect(user).toEqual(userInfoExpect);
      });
    });
  });
});
