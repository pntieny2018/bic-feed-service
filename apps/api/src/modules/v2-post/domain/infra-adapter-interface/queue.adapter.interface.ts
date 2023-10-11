import { Job } from '@libs/infra/queue';
import { JobId } from 'bull';

export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ContentScheduledJobPayload = {
  contentId: string;
  ownerId: string;
};

export interface IQueueAdapter {
  getJobById<T>(queueName: string, jobId: JobId): Promise<Job<T>>;
  killJob(queueName: string, jobId: JobId): Promise<void>;
  addQuizGenerateJob(quizId: string): Promise<void>;
  addQuizParticipantStartedJob(quizParticipantId: string, delayTime: number): Promise<void>;
  addContentScheduledJobs(payload: ContentScheduledJobPayload[]): Promise<void>;
}
