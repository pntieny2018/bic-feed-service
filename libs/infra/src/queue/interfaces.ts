import { JobId, JobOptions } from 'bull';

import { IContext, getContext } from '../log';

export interface Queue {
  name: string;
}

export interface Job<T> {
  id?: JobId;
  name: string;
  data: T;
  opts: JobOptions;
  queue: Queue;
}

export class JobWithContext<T> {
  public id?: JobId;
  public name: string;
  public data: { data: T; context: IContext };
  public opts: JobOptions;
  public queue: Queue;

  public constructor(job: Job<T>) {
    Object.assign(this, job);

    this.data = { data: job.data, context: getContext(job.name) };
  }
}

export interface IQueueService {
  addBulkJobs<T>(jobs: Job<T>[]): Promise<void>;
  getJobById<T>(queueName: string, jobId: JobId): Promise<Job<T>>;
  killJob(queueName: string, jobId: JobId): Promise<void>;
  addQuizJob(data: unknown): Promise<void>;
}

export const QUEUE_SERVICE_TOKEN = 'QUEUE_SERVICE_TOKEN';
