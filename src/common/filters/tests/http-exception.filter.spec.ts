import { HttpExceptionFilter } from '../http-exception.filter';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { LogicException, ValidatorException } from '../../exceptions';
import { HTTP_STATUS_ID } from '../../constants';

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
      const args = mockJson.mock.calls[0][0];
      expect(args.code).toBe(HTTP_STATUS_ID.API_SERVER_INTERNAL_ERROR);
    });
    it('Http exception: BadRequestException', () => {
      httpExceptionFilter.catch(
        new BadRequestException('Bad request exception'),
        mockArgumentsHost
      );
      expect(mockHttpArgumentsHost).toBeCalledTimes(1);
      expect(mockHttpArgumentsHost).toBeCalledWith();
      expect(mockGetResponse).toBeCalledTimes(1);
      expect(mockGetResponse).toBeCalledWith();
      expect(mockStatus).toBeCalledTimes(1);
      expect(mockStatus).toBeCalledWith(HttpStatus.BAD_REQUEST);
      const args = mockJson.mock.calls[0][0];
      expect(args.code).toBe(HTTP_STATUS_ID.API_VALIDATION_ERROR);
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
      mockGetResponse.mockImplementation(() => ({
        status: mockStatus,
        responseMessage: {
          validator: {
            fails: 'id must is a numeric',
          },
        },
      }));
      httpExceptionFilter.catch(new ValidatorException('Validate fails'), mockArgumentsHost);

      expect(mockHttpArgumentsHost).toBeCalledTimes(1);
      expect(mockHttpArgumentsHost).toBeCalledWith();
      expect(mockGetResponse).toBeCalledTimes(1);
      expect(mockGetResponse).toBeCalledWith();
      expect(mockStatus).toBeCalled();
      expect(mockStatus).toBeCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toBeCalledTimes(1);
      const args = mockJson.mock.calls[0][0];
      expect(args.meta.message).toEqual('id must is a numeric');
    });
    it('Validate with default message', () => {
      httpExceptionFilter.catch(new ValidatorException('Validate fails'), mockArgumentsHost);
      expect(mockHttpArgumentsHost).toBeCalledTimes(1);
      expect(mockHttpArgumentsHost).toBeCalledWith();
      expect(mockGetResponse).toBeCalledTimes(1);
      expect(mockGetResponse).toBeCalledWith();
      expect(mockStatus).toBeCalled();
      expect(mockStatus).toBeCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockJson).toBeCalledTimes(1);
    });
  });
  describe('getStack', () => {
    it('should show stack', () => {
      httpExceptionFilter['_appEnv'] = 'development';
      httpExceptionFilter.catch(
        new HttpException('Http exception', HttpStatus.INTERNAL_SERVER_ERROR),
        mockArgumentsHost
      );

      const args = mockJson.mock.calls[0][0];
      expect(args.meta.stack).not.toBeNull();
    });
    it('should not show stack', () => {
      httpExceptionFilter['_appEnv'] = 'satging';
      httpExceptionFilter.catch(
        new HttpException('Http exception', HttpStatus.INTERNAL_SERVER_ERROR),
        mockArgumentsHost
      );

      const args = mockJson.mock.calls[0][0];
      expect(args.meta.stack).toBeNull();
    });
  });

  describe('LogicException', () => {
    it('should show stack', () => {
      httpExceptionFilter['_appEnv'] = 'development';

      httpExceptionFilter.catch(
        new LogicException('logic'),
        mockArgumentsHost
      )
      const args = mockJson.mock.calls[0][0];
      expect(args.meta.stack).not.toBeNull();
    })
  })
});
