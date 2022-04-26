import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { LoggerBootstrap } from '../bootstrap/logger.bootstrap';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  await NestFactory.create(WorkerModule, {
    ...LoggerBootstrap.init(),
  });

  Logger.log(`Worker was started !`);
}

(async (): Promise<void> => await bootstrap())();
