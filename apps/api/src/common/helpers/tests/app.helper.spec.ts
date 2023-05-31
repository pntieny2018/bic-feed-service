import { AppHelper } from '../app.helper';
import { APP_SERVICE_KEY } from '../../constants';

describe('AppHelper', function () {
  describe('getAppServiceKey', function () {
    it('Should return app processors key ', function () {
      const userIdInput = '85dfe22e-866d-49a5-bbef-3fbc72e4febf';
      const response = AppHelper.getAppServiceKey(userIdInput);

      expect(Object.keys(response)).toContain(APP_SERVICE_KEY);
      expect(response[APP_SERVICE_KEY]).not.toBeNull();
    });
  });
});
