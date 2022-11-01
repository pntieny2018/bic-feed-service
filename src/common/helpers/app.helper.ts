import { StringHelper } from './string.helper';
import { APP_SERVICE_KEY } from '../constants';
export class AppHelper {
  /**
   * Get app processors key header to call api from Bein Backend
   * @param userId Number
   * @returns App processors key header
   */
  public static getAppServiceKey(userId: string): Record<string, any> {
    return {
      [APP_SERVICE_KEY]: `${userId}.${StringHelper.randomStr(6)}`,
    };
  }

  public static getRedisEnv(): string {
    return process.env.APP_ENV;
  }
}
