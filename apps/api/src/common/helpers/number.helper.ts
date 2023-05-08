export class NumberHelper {
  /**
   * Get random number in range
   * @param min min value
   * @param max max value
   * @returns number
   */
  public static randomInRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
}
