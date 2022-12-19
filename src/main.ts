import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppBootstrap } from './bootstrap/app.bootstrap';
import { ClassValidatorBootstrap } from './bootstrap/class-validator.bootstrap';
import { KafkaConsumerBootstrap } from './bootstrap/kafka-consumer.bootstrap';
import { LoggerBootstrap } from './bootstrap/logger.bootstrap';
import { SwaggerBootstrap } from './bootstrap/swagger.bootstrap';
import './common/extension';
import { KafkaHealthBootstrap } from './modules/health/kafka-health.bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    ...LoggerBootstrap.init(),
  });

  const configService = app.get<ConfigService>(ConfigService);

  ClassValidatorBootstrap.init(app, AppModule);
  SwaggerBootstrap.init(app, configService);
  KafkaConsumerBootstrap.init(app, configService)
    .then((app) => {
      KafkaHealthBootstrap.init(app);
    })
    .catch((ex) => Logger.debug(JSON.stringify(ex?.stack)));
  await AppBootstrap.init(app, configService);
}

(async (): Promise<void> => bootstrap())();
