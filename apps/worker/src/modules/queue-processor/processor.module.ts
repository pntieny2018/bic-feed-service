import { IRedisConfig } from '@libs/common/config/redis';
import {
  IWorkerService,
  WorkerService,
  WrapperModule,
  getWorkerConfig,
} from '@libs/infra/v2-queue';
import { JobPro } from '@libs/infra/v2-queue/shared';
import { Logger, OnModuleInit, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';

import { IProcessor, WorkerAdapters } from './interface';
import { ContentProcessor, QuizParticipantProcessor, QuizPendingProcessor } from './processors';
import { WORKER_ADAPTER_SERVICES } from './provider';

export const processorInstances = [
  ContentProcessor,
  QuizPendingProcessor,
  QuizParticipantProcessor,
];

const createChannelWorkerProviders = (adapters: WorkerAdapters[]): Provider[] => {
  return adapters.map((adapter) => ({
    provide: adapter.workerToken,
    useFactory: (configService: ConfigService): IWorkerService => {
      const redisConfig = configService.get<IRedisConfig>('redis');
      return new WorkerService({
        queueName: adapter.queueName,
        workerConfig: getWorkerConfig(redisConfig, adapter.groupConcurrency, adapter.concurrency),
      });
    },
    inject: [ConfigService],
  }));
};

@WrapperModule({
  imports: [CqrsModule],
  providers: [...createChannelWorkerProviders(WORKER_ADAPTER_SERVICES), ...processorInstances],
  exports: [],
})
export class ProcessorModule implements OnModuleInit {
  private readonly _logger = new Logger(ProcessorModule.name);

  public constructor(private readonly _moduleRef: ModuleRef) {}

  public onModuleInit(): void {
    for (const adapter of WORKER_ADAPTER_SERVICES) {
      const handler = this._moduleRef.get<IWorkerService>(adapter.workerToken);
      if (handler) {
        handler.bindProcessor(async (job: JobPro): Promise<void> => {
          const process = this._moduleRef.get<IProcessor>(adapter.processorToken);
          await process.processMessage(job);
        });
      }
    }
    process.on('beforeExit', async () => {
      this._logger.log('Application shutdown, stop worker');
      for (const adapter of WORKER_ADAPTER_SERVICES) {
        const handler = this._moduleRef.get<WorkerService>(adapter.workerToken);
        if (handler) {
          await handler.close();
        }
      }
    });
  }
}
