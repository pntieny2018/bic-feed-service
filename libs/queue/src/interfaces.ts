import { JobOptions } from 'bull';

export interface Job<T> {
  name: string;
  data: T;
  opts: JobOptions;
}
