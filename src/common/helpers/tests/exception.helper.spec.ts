import { ExceptionHelper } from '../exception.helper';
import { HttpException } from '@nestjs/common';

describe('ExceptionHelper', function () {
  describe('throw', function () {
    it('should throw exception', function () {
      const exceptionInfoMock = {
        message: 'not found',
        code: 404,
      };
      try {
        ExceptionHelper.throw(
          exceptionInfoMock.message,
          exceptionInfoMock.code
        );
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        const httpException: HttpException = e;
        expect(httpException.message).toBe(exceptionInfoMock.message);
        expect(httpException.getStatus()).toBe(exceptionInfoMock.code);
      }
    });
  });
});
