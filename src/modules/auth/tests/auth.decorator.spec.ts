import { AuthUser } from '../decorators';
import { userInfoExpect } from './mocks';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { LogicException } from '../../../common/exceptions';

describe('AuthDecorator', () => {
  const data = true; //AuthUser didn't use param data
  let factory;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function getParamDecoratorFactory(decorator: () => object): any {
    class TestAuthUserDecorator {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      test(@AuthUser() value): void {
        //do nothing
      }
    }

    const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestAuthUserDecorator, 'test');
    return args[Object.keys(args)[0]].factory;
  }

  const getRequestMock = jest.fn();

  const executionContextMock = {
    switchToHttp: (): any => ({ getRequest: getRequestMock }),
  };

  beforeEach(() => {
    factory = getParamDecoratorFactory(AuthUser);
  });

  describe('invalid user in request', () => {
    describe('undefine user', () => {
      const request = {};
      executionContextMock.switchToHttp().getRequest.mockReturnValueOnce(request);

      it('should throw UnauthorizedException', () => {
        expect(() => {
          factory(data, executionContextMock);
        }).toThrowError(LogicException);
      });
    });

    describe('null user', () => {
      const request = { user: null };
      executionContextMock.switchToHttp().getRequest.mockReturnValueOnce(request);

      it('should throw UnauthorizedException', () => {
        expect(() => {
          factory(data, executionContextMock);
        }).toThrowError(LogicException);
      });
    });
  });

  describe('valid user in request', () => {
    describe('undefined user', () => {
      const request = { user: userInfoExpect };
      executionContextMock.switchToHttp().getRequest.mockReturnValueOnce(request);

      it('should throw UnauthorizedException', () => {
        expect(factory(data, executionContextMock)).toEqual(userInfoExpect);
      });
    });
  });
});
