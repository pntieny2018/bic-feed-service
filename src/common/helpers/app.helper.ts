import { StringHelper } from './string.helper';
import { APP_SERVICE_KEY } from '../constants';
export class AppHelper {
  /**
   * Get app processors key header to call api from Bein Backend
   * @param userId Number
   * @returns App processors key header
   */
  public static getAppServiceKey(userId: number): Record<string, any> {
    return {
      [APP_SERVICE_KEY]: `${userId}.${StringHelper.randomStr(6)}`,
    };
  }

  public static getRedisEnv(): string {
    const appEnv = process.env.APP_ENV;
    switch (appEnv) {
      case 'development':
        return '';
      case 'sandbox':
        return 'sbx';
      case 'staging':
        return 'stg';
      case 'production':
        return 'prod';
    }
  }
}
