import { KafkaGateway } from '@app/kafka/kafka-gateway';
import { TracingInterceptor } from '@libs/infra/log';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { AppBootstrap } from './bootstrap/app.bootstrap';
import { ClassValidatorBootstrap } from './bootstrap/class-validator.bootstrap';
import { SwaggerBootstrap } from './bootstrap/swagger.bootstrap';
import './common/extension';
import { KafkaHealthBootstrap } from './modules/health/kafka-health.bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TracingInterceptor());

  const configService = app.get<ConfigService>(ConfigService);

  ClassValidatorBootstrap.init(app, AppModule);
  SwaggerBootstrap.init(app, configService);
  KafkaGateway.init(app, configService)
    .then((app) => {
      KafkaHealthBootstrap.init(app);
    })
    .catch((ex) => Logger.debug(JSON.stringify(ex?.stack)));
  await AppBootstrap.init(app, configService);
}

(async (): Promise<void> => bootstrap())();
