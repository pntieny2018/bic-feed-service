import { NumberHelper } from '../number.helper';

describe('NumberHelper', function () {
  describe('randomInRange', function () {
    it('should return random number in range', function () {
      const randomNumber = NumberHelper.randomInRange(1, 10);
      expect(randomNumber).toBeLessThanOrEqual(10);
      expect(randomNumber).toBeGreaterThanOrEqual(1);
    });
  });
});
