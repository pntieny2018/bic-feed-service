import './common/extension';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { AppBootstrap } from './bootstrap/app.bootstrap';
import { LoggerBootstrap } from './bootstrap/logger.bootstrap';
import { SwaggerBootstrap } from './bootstrap/swagger.bootstrap';
import { ClassValidatorBootstrap } from './bootstrap/class-validator.bootstrap';
import { KafkaConsumerBootstrap } from './bootstrap/kafka-consumer.bootstrap';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    ...LoggerBootstrap.init(),
  });

  const configService = app.get<ConfigService>(ConfigService);

  ClassValidatorBootstrap.init(app, AppModule);
  SwaggerBootstrap.init(app, configService);
 // await KafkaConsumerBootstrap.init(app, configService);
  await AppBootstrap.init(app, configService);
}

(async (): Promise<void> => await bootstrap())();
