import { DefaultJobOptions } from 'bullmq';

export interface IQueueService {
  add<T>(data: T, groupId?: string): void;
  getDefaultJobOptions(): DefaultJobOptions;
  close(): void;
}
