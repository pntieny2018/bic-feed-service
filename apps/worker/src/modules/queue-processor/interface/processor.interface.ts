import { Job } from 'bullmq';

export const CONTENT_SCHEDULED_PROCESSOR_TOKEN = 'CONTENT_SCHEDULED_PROCESSOR_TOKEN';

export interface IProcessor {
  processMessage(job: Job): Promise<void>;
}
