export class ArrayHelper {
  /**
   * Get difference from two array
   * @param a1 any[]
   * @param a2 any[]
   * @returns any[] Difference member of a1 vs a2
   */
  public static arrDifferenceElements(a1: any[], a2: any[]): any[] {
    const a2Set = new Set(a2);
    return a1.filter(function (x) {
      return !a2Set.has(x);
    });
  }

  /**
   * Check is array
   * @param elements  Any[]
   * @returns Is array
   */
  public static isArray = function (elements: unknown[]): boolean {
    return !!elements && elements.constructor === Array;
  };

  /**
   * Check is number array sorted
   * @param elements  Number[]
   * @returns Is number array sorted
   */
  public static isArraySorted(elements: number[]): boolean {
    let isSorted = true;
    for (let i = 0; i < elements.length - 1; i++) {
      if (elements[i] > elements[i + 1]) {
        isSorted = false;
        break;
      }
    }
    return isSorted;
  }

  /**
   * Check if 2 arrays have the same elements
   * @param a any[]
   * @param b any[]
   * @returns bool  true if 2 arrays have the same elements
   */
  public static arraysEqual(a: unknown[], b: unknown[]): boolean {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val) => b.includes(val))
    );
  }

  public static arrayUnique(arr: any[]): any[] {
    return arr.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }
}
