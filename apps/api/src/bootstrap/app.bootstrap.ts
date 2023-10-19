import { HEADER_VERSION_KEY, IS_LOCAL } from '@libs/common/constants';
import { INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import { Logger, PinoLogger } from 'nestjs-pino';

import { HttpExceptionFilter } from '../common/filters';
import { HandleResponseInterceptor } from '../common/interceptors';
import { IAppConfig } from '../config/app';

export class AppBootstrap {
  /**
   * Initializers the AppBootstrap.
   * @param app Reference instance of INestApplication.
   * @param configService Reference instance of ConfigService.
   * @return void
   */
  public static async init(app: INestApplication, configService: ConfigService): Promise<void> {
    const appConfig = configService.get<IAppConfig>('app');
    app.enableCors({
      origin: '*',
    });

    app.enableVersioning({
      type: VersioningType.HEADER,
      header: HEADER_VERSION_KEY,
    });
    app.useGlobalInterceptors(new HandleResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(appConfig.env, '/'));

    if (!IS_LOCAL) {
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
      `${appConfig.name} API run in ${appConfig.url}:${appConfig.port}`,
      'NestApplication'
    );
  }
}
