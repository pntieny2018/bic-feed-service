import './common/extension';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { AppBootstrap } from './bootstrap/app.bootstrap';
import { SwaggerBootstrap } from './bootstrap/swagger.bootstrap';
import { IAppConfig } from './config/app';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  const appConfig = configService.get<IAppConfig>('app');

  app.setGlobalPrefix(appConfig.apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    })
  );
  SwaggerBootstrap.init(app, configService);
  await AppBootstrap.init(app, configService);
}

(async (): Promise<void> => await bootstrap())();
