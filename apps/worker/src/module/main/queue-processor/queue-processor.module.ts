import { IRedisConfig } from '@libs/common/config/redis';
import {
  IWorkerService,
  WorkerService,
  WrapperModule,
  getWorkerConfig,
} from '@libs/infra/v2-queue';
import { Logger, OnModuleInit, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { Job } from 'bullmq';

import { WORKER_ADAPTER_SERVICES, WorkerConstants } from './data-type';

const PROCESSORS = WORKER_ADAPTER_SERVICES.map((worker) => worker.PROCESSOR_TOKEN) as Provider[];

const createChannelWorkerProviders = (workerConstants: WorkerConstants[]): Provider[] => {
  return workerConstants.map((worker) => ({
    provide: worker.WORKER_TOKEN,
    useFactory: (configService: ConfigService): IWorkerService => {
      const redisConfig = configService.get<IRedisConfig>('redis');
      return new WorkerService({
        queueName: worker.QUEUE_NAME,
        workerConfig: getWorkerConfig(redisConfig, worker.GROUP_CONCURRENCY),
      });
    },
    inject: [ConfigService],
  }));
};

@WrapperModule({
  providers: [...createChannelWorkerProviders(WORKER_ADAPTER_SERVICES), ...PROCESSORS],
  exports: [],
})
export class QueueProcessorModule implements OnModuleInit {
  private readonly _logger = new Logger(QueueProcessorModule.name);

  public constructor(private readonly _moduleRef: ModuleRef) {}

  public onModuleInit(): void {
    for (const worker of WORKER_ADAPTER_SERVICES) {
      const handler = this._moduleRef.get<IWorkerService>(worker.WORKER_TOKEN);
      if (handler) {
        handler.bindProcess({
          process: (): unknown => {
            return worker.PROCESSOR_TOKEN;
          },
          onCompletedProcess: async (job: Job): Promise<void> => {
            this._logger.debug(`Job has been processed with data: ${JSON.stringify(job.data)}`);
          },
          onFailedProcess: async (job: Job, error: Error): Promise<void> => {
            this._logger.debug(`Job has been failed with data: ${JSON.stringify(job.data)}`);
            this._logger.error(error);
          },
        });
      }
    }
    process.on('beforeExit', async () => {
      this._logger.log('Application shutdown, stop worker');
      for (const worker of WORKER_ADAPTER_SERVICES) {
        const handler = this._moduleRef.get<WorkerService>(worker.WORKER_TOKEN);
        if (handler) {
          await handler.close();
        }
      }
    });
  }
}
