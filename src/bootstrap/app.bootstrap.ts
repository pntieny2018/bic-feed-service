import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json } from 'express';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';
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

    app.useGlobalInterceptors(new HandleResponseInterceptor());
   // app.useGlobalPipes(new I18nValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter(appConfig.env, '/'));
   // app.useGlobalFilters(new I18nValidationExceptionFilter());

    app.use(
      json({
        limit: 52428800, // maximum 50MB
      })
    );
    await app.listen(appConfig.port).catch((ex) => Logger.error(ex));

    Logger.debug(`${appConfig.name} API run in ${appConfig.url}`, 'NestApplication');
  }
}
