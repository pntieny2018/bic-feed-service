import { INestApplication, Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import { HttpExceptionFilter } from '../common/filters';
import { HandleResponseInterceptor } from '../common/interceptors';
import { IAppConfig } from '../config/app';
import { VERSION_HEADER_KEY } from '../common/constants';

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
      header: VERSION_HEADER_KEY,
    });
    app.useGlobalInterceptors(new HandleResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter(appConfig.env, '/'));

    app.use(
      json({
        limit: 52428800, // maximum 50MB
      })
    );
    await app.listen(appConfig.port).catch((ex) => Logger.error(ex));

    Logger.debug(
      `${appConfig.name} API run in ${appConfig.url}:${appConfig.port}`,
      'NestApplication'
    );
  }
}
