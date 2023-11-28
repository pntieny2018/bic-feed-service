import { Job } from 'bullmq';

export interface IProcessor {
  processMessage(job: Job): Promise<void>;
}
