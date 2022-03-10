import { AxiosHelper } from '../axios.helper';

describe('AxiosHelper', function () {
  describe('getDataResponse', function () {
    it('should return data from axios response', function () {
      type mockDataType = {
        name: string;
        avatar: string;
      };
      const expectData = {
        name: 'rose',
        avatar: 'http://abc.com/rose.jpg',
      };
      const axiosResponseMock = {
        data: {
          data: expectData,
        },
        status: 200,
      };
      const result = AxiosHelper.getDataResponse<mockDataType>(axiosResponseMock as any);

      expect(result).toMatchObject(expectData);
    });

    it('should return empty data from axios response', function () {
      type mockDataType = {
        name: string;
        avatar: string;
      };
      const expectData = {};
      const axiosResponseMock = {
        data: {
          data: expectData,
        },
        status: 200,
      };
      const result = AxiosHelper.getDataResponse<mockDataType>(axiosResponseMock as any);

      expect(result).toMatchObject(expectData);
    });
  });
  describe('injectParamsToStrUrl', function () {
    it('should return path with injected params', function () {
      const paramMock = {
        userId: 4,
      };
      const pathMock = 'users/:userId';

      const expectPath = `users/${paramMock.userId}`;

      const result = AxiosHelper.injectParamsToStrUrl(pathMock, paramMock);

      expect(result).toEqual(expectPath);
    });
  });
});
