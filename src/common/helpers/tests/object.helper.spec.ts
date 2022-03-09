import { ObjectHelper } from '../object.helper';

describe('ObjectHelper', function () {
  describe('omit', function () {
    it('should return new object excluded key mock', function () {
      const objectMock = {
        username: 'rose',
        email: 'rose@gmail.com',
        password: '12345',
      };
      const excludeKeyMock = 'password';
      const expectResult = {
        username: objectMock.username,
        email: objectMock.email,
      };
      const result = ObjectHelper.omit([excludeKeyMock], objectMock);
      expect(result).toMatchObject(expectResult);
    });
  });
});
