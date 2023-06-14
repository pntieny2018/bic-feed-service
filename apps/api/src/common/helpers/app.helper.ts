import { StringHelper } from './string.helper';
import { APP_SERVICE_KEY, MINIMUM_VERSION_SUPPORT, VERSIONS_SUPPORTED } from '../constants';
import semver from 'semver';

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
    return process.env.REDIS_ENV;
  }

  public static getVersionsSupported(): string[] {
    return VERSIONS_SUPPORTED.filter((version) => semver.gte(version, MINIMUM_VERSION_SUPPORT)).map(
      (version) => version
    );
  }

  public static getVersionsSupportedFrom(minVersion: string): string[] {
    return VERSIONS_SUPPORTED.filter((version) => semver.gte(version, minVersion)).map(
      (version) => version
    );
  }

  public static getVersionsSupportedTo(maxVersion: string): string[] {
    return VERSIONS_SUPPORTED.filter((version) => semver.lte(version, maxVersion)).map(
      (version) => version
    );
  }
}
