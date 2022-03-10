import { ArrayHelper } from '../array.helper';

describe('ArrayHelper', function () {
  describe('differenceArrNumber', function () {
    it('should return difference item of first array with second array', function () {
      const firstArrayMock = [1, 2, 3];
      const secondArrayMock = [2, 3, 4];

      const result = ArrayHelper.differenceArrNumber(firstArrayMock, secondArrayMock);

      expect(result).toEqual([1]);
    });
  });
  describe('isArray', function () {
    it('should return true if is a array', function () {
      const result = ArrayHelper.isArray([1, 2, 3, 4]);
      expect(result).toBe(true);
    });

    it('should return false if is not a array', function () {
      const inputString = ArrayHelper.isArray('a' as any);
      const inputNumber = ArrayHelper.isArray(1 as any);
      const inputObject = ArrayHelper.isArray({} as any);
      const inputUndefined = ArrayHelper.isArray(undefined as any);
      const inputNull = ArrayHelper.isArray(null as any);
      const inputNaN = ArrayHelper.isArray(NaN as any);

      expect(inputString).toEqual(false);
      expect(inputNumber).toEqual(false);
      expect(inputObject).toEqual(false);

      expect(inputUndefined).toEqual(false);
      expect(inputNull).toEqual(false);
      expect(inputNaN).toEqual(false);
    });
  });
  describe('isArraySorted', function () {
    it('should return true if is a sorted number array', function () {
      const result = ArrayHelper.isArraySorted([1, 2, 3, 4]);
      expect(result).toBe(true);
    });

    it('should return false if is not a sorted number array', function () {
      const result = ArrayHelper.isArraySorted([8, 1, 2, 3, 4]);
      expect(result).toBe(false);
    });
  });
});
