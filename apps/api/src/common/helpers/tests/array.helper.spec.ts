import { ArrayHelper } from '../array.helper';

describe('ArrayHelper', function () {
  describe('differenceArrNumber', function () {
    it('should return difference item of first array with second array', function () {
      const firstArrayMock = [1, 2, 3];
      const secondArrayMock = [2, 3, 4];

      const result = ArrayHelper.arrDifferenceElements(firstArrayMock, secondArrayMock);

      expect(result).toEqual([1]);
    });
  });
  describe('isArray', function () {
    it('should return true if is a array', function () {
      const isArray = ArrayHelper.isArray([1, 2, 3, 4]);
      expect(isArray).toBe(true);
    });

    it('should return false if is not a array', function () {
      const isInputString = ArrayHelper.isArray('a' as any);
      const isInputNumber = ArrayHelper.isArray(1 as any);
      const isInputObject = ArrayHelper.isArray({} as any);
      const isInputUndefined = ArrayHelper.isArray(undefined as any);
      const isInputNull = ArrayHelper.isArray(null as any);
      const isInputNaN = ArrayHelper.isArray(NaN as any);

      expect(isInputString).toEqual(false);
      expect(isInputNumber).toEqual(false);
      expect(isInputObject).toEqual(false);

      expect(isInputUndefined).toEqual(false);
      expect(isInputNull).toEqual(false);
      expect(isInputNaN).toEqual(false);
    });
  });
  describe('isArraySorted', function () {
    it('should return true if is a sorted number array', function () {
      const isArraySorted = ArrayHelper.isArraySorted([1, 2, 3, 4]);
      expect(isArraySorted).toBe(true);
    });

    it('should return false if is not a sorted number array', function () {
      const isArraySorted = ArrayHelper.isArraySorted([8, 1, 2, 3, 4]);
      expect(isArraySorted).toBe(false);
    });
  });

  describe('arraysEqual', function () {
    it('should return true if two array equal ', function () {
      const flag = ArrayHelper.arraysEqual([1, 2], [2, 1]);
      expect(flag).toBeTruthy();
    });
    it('should return false if two array not equal ', function () {
      const flag = ArrayHelper.arraysEqual([1, 2, 3], [2, 1]);
      expect(flag).toBeFalsy();
    });
  });
  describe('arrayUnique', function () {
    it('should return unit array', function () {
      const result = ArrayHelper.arrayUnique([1, 2, 3, 5, 3, 1, 1]);
      expect(result).toEqual([1, 2, 3, 5]);
    });
    it('should return empty array ', function () {
      const result = ArrayHelper.arrayUnique([]);
      expect(result).toEqual([]);
    });
  });
});
