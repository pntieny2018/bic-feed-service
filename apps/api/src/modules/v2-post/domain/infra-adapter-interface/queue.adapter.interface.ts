import { QueueName } from '@libs/infra/v2-queue';

export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ContentChangedJobPayload = {
  contentId: string;
  newGroupIds: string[];
  oldGroupIds: string[];
  limit: number;
};

export interface IQueueAdapter {
  hasJob(queueName: QueueName, jobId: string): Promise<boolean>;
  killJob(queueName: QueueName, jobId: string): Promise<void>;
  addQuizGenerateJob(quizId: string): Promise<void>;
  addQuizParticipantStartedJob(quizParticipantId: string, delayTime: number): Promise<void>;
  addContentChangedJob(payload: ContentChangedJobPayload): Promise<void>;
}
