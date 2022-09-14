import { Request } from 'express';
import { AuthService } from '../auth.service';
import { AuthMiddleware } from '../auth.middleware';
import { authInput, userInfoExpect } from './mocks';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe.skip('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  const authServiceMock = {
    login: jest.fn(),
  };

  const next = jest.fn();

  const res = null;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
        AuthMiddleware,
      ],
    }).compile();

    authMiddleware = module.get<AuthMiddleware>(AuthMiddleware);
  });

  describe('invalid authorization', () => {
    describe('undefine authorization', () => {
      const req = {
        baseUrl: '/abcd/',
        headers: {
        },
      };

      it('should throw UnauthorizedException', () => {
        expect(async () => {
          await authMiddleware.use(req as Request, res, next);
        }).rejects.toThrowError(UnauthorizedException);
      });
    });

    describe('null authorization', () => {
      const req = {
        headers: {
          authorization: null,
        },
      };

      it('should throw UnauthorizedException', () => {
        expect(async () => {
          await authMiddleware.use(req as Request, res, next);
        }).rejects.toThrowError(UnauthorizedException);
      });
    });

    describe('empty authorization', () => {
      const req = {
        headers: {
          authorization: '',
        },
      };

      authServiceMock.login.mockRejectedValue(new UnauthorizedException('Unauthorized'));

      it('should throw UnauthorizedException', () => {
        expect(async () => {
          await authMiddleware.use(req as Request, res, next);
        }).rejects.toThrowError(UnauthorizedException);
      });
    });
  });

  describe('valid authorization', () => {
    describe('valid authorization', () => {
      const req = {
        headers: {
          authorization: authInput.tokenValid,
        },
        user: null,
      };

      authServiceMock.login.mockReturnValueOnce(userInfoExpect);

      it('Request should have data in req.user', async () => {
        await authMiddleware.use(req as Request, res, next);

        expect(req.user).toEqual(userInfoExpect);
        expect(next).toBeCalled();
      });
    });
  });
});
