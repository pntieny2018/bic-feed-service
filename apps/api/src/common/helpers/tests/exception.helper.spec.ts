import { ExceptionHelper } from '../exception.helper';
import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';

describe('ExceptionHelper', function () {
  describe('throw', function () {
    it('should throw BadRequestException', function () {
      const exceptionInfoMock = {
        message: 'bad request',
        code: 400,
      };
      try {
        ExceptionHelper.throwBadRequestException(exceptionInfoMock.message);
      } catch (e) {
        expect(e).toBeInstanceOf(BadRequestException);
        const httpException: HttpException = e;
        expect(httpException.message).toEqual(exceptionInfoMock.message);
        expect(httpException.getStatus()).toBe(exceptionInfoMock.code);
      }
    });
    it('should throw NotFoundException', function () {
      const exceptionInfoMock = {
        message: 'not found request',
        code: 404,
      };
      try {
        ExceptionHelper.throwNotFoundException(exceptionInfoMock.message);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
        const httpException: NotFoundException = e;
        expect(httpException.message).toEqual(exceptionInfoMock.message);
        expect(httpException.getStatus()).toBe(exceptionInfoMock.code);
      }
    });
    it('should throw exception', function () {
      const exceptionInfoMock = {
        message: 'internal error',
        code: 500,
      };
      try {
        ExceptionHelper.throw(exceptionInfoMock.message, exceptionInfoMock.code);
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        const httpException: HttpException = e;
        expect(httpException.message).toBe(exceptionInfoMock.message);
        expect(httpException.getStatus()).toBe(exceptionInfoMock.code);
      }
    });
  });
});
