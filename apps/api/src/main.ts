import { TracingInterceptor } from '@libs/infra/log';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { AppBootstrap } from './bootstrap/app.bootstrap';
import { ClassValidatorBootstrap } from './bootstrap/class-validator.bootstrap';
import { SwaggerBootstrap } from './bootstrap/swagger.bootstrap';
import { bootstrapCLI } from './command';

import './common/extension';

async function bootstrap(): Promise<void> {
  if (process.env.TRIGGER_CLI === 'true') {
    return bootstrapCLI();
  }

  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TracingInterceptor());

  const configService = app.get<ConfigService>(ConfigService);

  ClassValidatorBootstrap.init(app, AppModule);
  SwaggerBootstrap.init(app, configService);
  await AppBootstrap.init(app, configService);
}

(async (): Promise<void> => bootstrap())();
