import { WorkerOptions } from 'bullmq';
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface JobTtlMap {
  [jobName: string]: number;
}
// eslint-disable-next-line @typescript-eslint/naming-convention
export interface WorkerProOptions extends WorkerOptions {
  ttl?: number | JobTtlMap;
  group?: {
    limit?: {
      max: number;
      duration: number;
    };
    /**
     * Maximum number of jobs to process in parallel for a given worker.
     */
    concurrency?: number;
  };
}
