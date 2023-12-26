import { Logger } from '@nestjs/common';

import { IWorkerService } from './interfaces';
import { JobPro, QueueEventsPro, WorkerPro, WorkerProOptions } from './shared';

export class WorkerService implements IWorkerService {
  private _worker: WorkerPro;
  private _logger = new Logger(WorkerService.name);

  public constructor(
    private readonly _config: {
      queueName: string;
      workerConfig: WorkerProOptions;
    }
  ) {
    const { queueName, workerConfig } = _config;
    const queueEvents = new QueueEventsPro(queueName, workerConfig);

    this.registerEventHandler(queueEvents);
  }

  public registerEventHandler(queueEvents: QueueEventsPro): void {
    queueEvents.on('completed', (args) => {
      this._logger.debug(`Job ${args.jobId} in ${queueEvents.name} has been completed`);
    });
    queueEvents.on('failed', (args) => {
      this._logger.error(
        `Job ${args.jobId} in ${queueEvents.name} has been failed with reason ${args.failedReason}`
      );
    });
  }

  public bindProcessor<T>(handlers: (job: JobPro<T>) => Promise<void>): void {
    const { queueName, workerConfig } = this._config;

    this._worker = new WorkerPro(
      queueName,
      async (job: JobPro) => {
        this._logger.debug(
          `Job ${job.id} in ${queueName} be processed with data ${JSON.stringify(job.data)}`
        );
        await handlers(job);
      },
      workerConfig
    );
  }

  public async close(): Promise<void> {
    return this._worker.close();
  }
}
