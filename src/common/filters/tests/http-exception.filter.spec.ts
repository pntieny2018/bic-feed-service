import { HttpExceptionFilter } from '../http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseDto } from '../../dto';
import { ValidatorException } from '../../exceptions';

const mockJson = jest.fn();

const mockStatus = jest.fn().mockImplementation(() => ({
  json: mockJson,
}));

const mockGetResponse = jest.fn().mockImplementation(() => ({
  status: mockStatus,
}));

const mockHttpArgumentsHost = jest.fn().mockImplementation(() => ({
  getResponse: mockGetResponse,
  getRequest: jest.fn(),
}));

const mockArgumentsHost = {
  switchToHttp: mockHttpArgumentsHost,
  getArgByIndex: jest.fn(),
  getArgs: jest.fn(),
  getType: jest.fn(),
  switchToRpc: jest.fn(),
  switchToWs: jest.fn(),
};

describe('System header validation service', () => {
  let httpExceptionFilter: HttpExceptionFilter;

  beforeEach(async () => {
    jest.clearAllMocks();
    httpExceptionFilter = new HttpExceptionFilter('development', '/');
  });

  it('should be defined', () => {
    expect(httpExceptionFilter).toBeDefined();
  });
  describe('HttpExceptionFilter', () => {
    it('Http exception', () => {
      httpExceptionFilter.catch(
        new HttpException('Http exception', HttpStatus.INTERNAL_SERVER_ERROR),
        mockArgumentsHost
      );
      expect(mockHttpArgumentsHost).toBeCalledTimes(1);
      expect(mockHttpArgumentsHost).toBeCalledWith();
      expect(mockGetResponse).toBeCalledTimes(1);
      expect(mockGetResponse).toBeCalledWith();
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toBeCalledTimes(1);
    });
    it('Unknown exception', () => {
      httpExceptionFilter.catch(new Error('redis timeout'), mockArgumentsHost);
      expect(mockHttpArgumentsHost).toBeCalledTimes(1);
      expect(mockHttpArgumentsHost).toBeCalledWith();
      expect(mockGetResponse).toBeCalledTimes(1);
      expect(mockGetResponse).toBeCalledWith();
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toBeCalledTimes(1);
    });
    it('Validate exception', () => {
      httpExceptionFilter.catch(new ValidatorException('Validate fails'), mockArgumentsHost);
      expect(mockHttpArgumentsHost).toBeCalledTimes(1);
      expect(mockHttpArgumentsHost).toBeCalledWith();
      expect(mockGetResponse).toBeCalledTimes(1);
      expect(mockGetResponse).toBeCalledWith();
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toBeCalledTimes(1);
    });
  });
});
