export class BooleanHelper {
  public static convertStringToBoolean(value): boolean | null {
    {
      if (value === 'true') {
        return true;
      }
      if (value === 'false') {
        return false;
      }
      return null;
    }
  }
}
