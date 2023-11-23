import { ENV } from '@libs/common/constants';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import { Logger, PinoLogger } from 'nestjs-pino';
import { IAppConfig } from '@libs/common/config/app';

export class WorkerBootstrap {
  /**
   * Initializers the AppBootstrap.
   * @param app Reference instance of INestApplication.
   * @param configService Reference instance of ConfigService.
   * @return void
   */
  public static async init(app: INestApplication, configService: ConfigService): Promise<void> {
    const appConfig = configService.get<IAppConfig>('app');

    const isLocal = !Object.values(ENV).includes(appConfig.env);
    if (!isLocal) {
      app.useLogger(app.get(Logger));
    }

    app.use(
      json({
        limit: 52428800, // maximum 50MB
      })
    );

    const logger = new PinoLogger({}).logger;

    await app.listen(appConfig.port).catch((ex) => logger.error(ex));

    logger.debug(
      `${appConfig.name} worker run in ${appConfig.url}:${appConfig.port}`,
      'NestApplication'
    );
  }
}
