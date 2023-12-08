import { IWorkerService } from './interfaces';
import { JobPro, WorkerPro, WorkerProOptions } from './shared';

export class WorkerService implements IWorkerService {
  private _worker: WorkerPro;

  public constructor(
    private readonly _config: {
      queueName: string;
      workerConfig: WorkerProOptions;
    }
  ) {}

  public bindProcess<T>(handlers: {
    process(job: JobPro<T>): Promise<void>;
    onCompletedProcess(job: JobPro<T>): Promise<void>;
    onFailedProcess(job: JobPro<T>, error: Error, prev: string): Promise<void>;
  }): void {
    const { queueName, workerConfig } = this._config;

    this._worker = new WorkerPro(
      queueName,
      async (job: JobPro) => handlers.process(job),
      workerConfig
    );

    this._worker.on('completed', async (job: JobPro) => handlers.onCompletedProcess(job));

    this._worker.on('failed', async (job: JobPro, error, prev) =>
      handlers.onFailedProcess(job, error, prev)
    );
  }

  public async close(): Promise<void> {
    return this._worker.close();
  }
}
