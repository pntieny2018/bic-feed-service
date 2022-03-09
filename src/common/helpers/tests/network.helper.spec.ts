import { NetworkHelper } from '../network.helper';
import { isIPv4 } from 'net';

describe('NetworkHelper', function () {
  describe('getPrivateIPNInfos', function () {
    it('should return IPv4 addresses from the private address ', function () {
      const result = NetworkHelper.getPrivateIPNInfos();
      expect(result).toBeInstanceOf(Array);
      if (result.length) {
        expect(isIPv4(result[0].address)).toBe(true);
      }
    });
  });
  describe('getPrivateIPs', function () {
    it('should return IPv4 addresses from the private address ', function () {
      const result = NetworkHelper.getPrivateIPs();
      expect(result).toBeInstanceOf(Array);

      if (result.length) {
        expect(isIPv4(result[0])).toBe(true);
      }
    });
  });
  describe('getPrivateExternalIPNInfos', function () {
    it('should return IPv4 addresses from the private address ', function () {
      const result = NetworkHelper.getPrivateExternalIPNInfos();
      expect(result).toBeInstanceOf(Array);

      if (result.length) {
        expect(isIPv4(result[0].address)).toBe(true);
      }
    });
  });
  describe('getPrivateExternalIPs', function () {
    it('should return IPv4 addresses from the private address ', function () {
      const result = NetworkHelper.getPrivateExternalIPs();
      expect(result).toBeInstanceOf(Array);

      if (result.length) {
        expect(isIPv4(result[0])).toBe(true);
      }
    });
  });
  describe('getPrivateExternalIPNInfos', function () {
    it('should return IPv4 addresses from the private address ', function () {
      const result = NetworkHelper.getPrivateExternalIPNInfos();
      expect(result).toBeInstanceOf(Array);
      if (result.length) {
        expect(isIPv4(result[0].address)).toBe(true);
      }
    });
  });
});
