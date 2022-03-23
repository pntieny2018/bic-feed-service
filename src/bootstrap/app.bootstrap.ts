import { IAppConfig } from '../config/app';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '../common/filters';
import { INestApplication, Logger, VersioningType } from '@nestjs/common';

export class AppBootstrap {
  /**
   * Initializers the AppBootstrap.
   * @param app Reference instance of INestApplication.
   * @param configService Reference instance of ConfigService.
   * @return void
   */
  public static async init(app: INestApplication, configService: ConfigService): Promise<void> {
    const appConfig = configService.get<IAppConfig>('app');

    app.enableVersioning({
      type: VersioningType.URI,
    });

    app.setGlobalPrefix(appConfig.apiPrefix);

    app.useGlobalFilters(new HttpExceptionFilter(appConfig.env, '/'));

    await app.listen(appConfig.port).catch((ex) => Logger.error(ex));

    Logger.log(`${appConfig.name} API run in ${appConfig.url}`, 'NestApplication');
  }
}
