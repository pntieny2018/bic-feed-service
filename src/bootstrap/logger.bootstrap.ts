import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export class LoggerBootstrap {
  public static init(): object {
    return process.env.APP_LOGGER_WINSTON === 'false'
      ? {}
      : {
          logger: WinstonModule.createLogger({
            transports: [
              new winston.transports.Console({
                level: 'debug',
                format: winston.format.json(),
              }),
            ],
          }),
        };
  }
}
