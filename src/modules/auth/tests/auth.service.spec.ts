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
});
