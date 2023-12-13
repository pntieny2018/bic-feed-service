import { JobPro } from '../shared';

export interface IWorkerService {
  bindProcessor<T>(handlers: (job: JobPro<T>) => Promise<void>): void;
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
