import { JobPro } from '../shared';

export const CONTENT_SCHEDULED_WORKER_TOKEN = 'CONTENT_SCHEDULED_WORKER_TOKEN';

export interface IWorkerService {
  bindProcess<T>(handlers: {
    process(job: JobPro<T>): Promise<void>;
    onCompletedProcess(job: JobPro<T>): Promise<void>;
    onFailedProcess(job: JobPro<T>, error: Error, prev: string): Promise<void>;
  }): void;
  close(): Promise<void>;
}

/**
 * @note Duration limit and concurrency cannot be used together
 */
export interface IGroupConcurrency {
  limit?: {
    max: number;
    duration: number;
  };
  concurrency?: number;
}
