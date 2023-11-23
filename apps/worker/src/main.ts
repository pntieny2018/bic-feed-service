import { KafkaGateway } from '@libs/infra/kafka';
import { TracingInterceptor } from '@libs/infra/log';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { WorkerBootstrap } from './app.bootstrap';
import { join } from 'path';
import { existsSync } from 'fs';
import { config } from 'dotenv';
import { KafkaHealthBootstrap } from '@libs/common/health-check/kafka-health.bootstrap';

const pathEnv = join(__dirname, '.env');
console.log(pathEnv);
if (existsSync(pathEnv)) {
  config({
    path: pathEnv,
  });
} else {
  config({
    path: process.env.DOTENV_CONFIG_PATH,
  });
}
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(WorkerModule);
  //app.useGlobalInterceptors(new TracingInterceptor());

  const configService = app.get<ConfigService>(ConfigService);

  KafkaGateway.init(app, configService)
    .then((app) => {
      Logger.debug('Kafka Gateway initialized');
      KafkaHealthBootstrap.init(app);
    })
    .catch((ex) => {
      Logger.debug(JSON.stringify(ex?.stack));
    });
  await WorkerBootstrap.init(app, configService);
}

(async (): Promise<void> => bootstrap())();
