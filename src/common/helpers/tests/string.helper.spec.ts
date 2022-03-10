import { StringHelper } from '../string.helper';

describe('StringHelper', function () {
  describe('camelToSnakeCase', function () {
    it('should return snake case string', function () {
      const stringMock = 'hashRate';
      const expectString = 'hash_rate';
      const result = StringHelper.camelToSnakeCase(stringMock, []);
      expect(result).toEqual(expectString);
    });
  });
  describe('snakeToCamelCase', function () {
    it('should return camel case string', function () {
      const stringMock = 'hash_rate';
      const expectString = 'hashRate';

      const result = StringHelper.snakeToCamelCase(stringMock);
      expect(result).toEqual(expectString);
    });
  });
  describe('parseCookieStr', function () {
    it('should return cookie object from cookie string', function () {
      const cookieStringMock = 'auth_id=237e2b6ff5282f665f99cfc73a97e7b1; token=asdsad231232dasd';

      const expectCookieObject = {
        auth_id: '237e2b6ff5282f665f99cfc73a97e7b1',
        token: 'asdsad231232dasd',
      };

      const result = StringHelper.parseCookieStr(cookieStringMock);

      expect(result).toMatchObject(expectCookieObject);
      expect(result).toEqual(expectCookieObject);
    });
  });
  describe('isJson', function () {
    it('should return true if is json', function () {
      const jsonMock = {
        name: 'rose',
      };
      const result = StringHelper.isJson(JSON.stringify(jsonMock));
      expect(result).toBe(true);
    });

    it('should return false if is not json', function () {
      const result = StringHelper.isJson('asdsadawsd');
      expect(result).toBe(false);
    });
  });
  describe('randomStr', function () {
    it('should return random string', function () {
      const lengthMock = 10;

      const result = StringHelper.randomStr(lengthMock);

      expect(result.length).toBe(lengthMock);
    });
  });
});
