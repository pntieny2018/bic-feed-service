import { JobPro } from '../shared';

export interface IWorkerService {
  bindProcess<T>(handlers: {
    process(queueName: string): unknown;
    onCompletedProcess(job: JobPro<T>): Promise<void>;
    onFailedProcess(job: JobPro<T>, error: Error, prev: string): Promise<void>;
  }): void;
  close(): Promise<void>;
}
