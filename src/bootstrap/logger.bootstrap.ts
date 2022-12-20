import { getAppConfig } from 'src/config/app';

export class LoggerBootstrap {
  public static init(): object {
    return getAppConfig().env === 'local'
      ? {}
      : {
          logger: ['warn', 'debug', 'error'],
        };
  }
}
