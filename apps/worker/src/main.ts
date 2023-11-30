import { KafkaHealthBootstrap } from '@libs/common/health-check/kafka-health.bootstrap';
import { KafkaGateway } from '@libs/infra/kafka';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { WorkerBootstrap } from './app.bootstrap';
import { WorkerModule } from './worker.module';
import './extension';

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
