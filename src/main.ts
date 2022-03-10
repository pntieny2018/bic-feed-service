import './common/extension';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { AppBootstrap } from './bootstrap/app.bootstrap';
import { SwaggerBootstrap } from './bootstrap/swagger.bootstrap';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import { ClassValidatorBootstrap } from './bootstrap/class-validator.bootstrap';

async function bootstrap(): Promise<void> {
  const logger =
    process.env.APP_LOGGER_WINSTON === 'false'
      ? {}
      : {
          logger: WinstonModule.createLogger({
            transports: [
              new winston.transports.Console({
                level: 'debug',
                format: winston.format.json(),
              }),
            ],
          }),
        };
  const app = await NestFactory.create(AppModule, {
    ...logger,
  });

  const configService = app.get<ConfigService>(ConfigService);

  ClassValidatorBootstrap.init(app, AppModule);
  SwaggerBootstrap.init(app, configService);
  await AppBootstrap.init(app, configService);
}

(async (): Promise<void> => await bootstrap())();
