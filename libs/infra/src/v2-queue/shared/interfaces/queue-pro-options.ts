import { QueueOptions } from 'bullmq';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface QueueProOptions extends QueueOptions {
  isPro?: boolean;
}
