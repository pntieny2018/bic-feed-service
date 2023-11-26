import { DefaultJobOptions } from 'bullmq';

export interface IQueueService {
  add<T>(data: T, groupId?: string): Promise<void>;
  getDefaultJobOptions(): DefaultJobOptions;
  close(): Promise<void>;
}
