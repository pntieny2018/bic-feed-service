import { JobId, JobOptions } from 'bull';

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
