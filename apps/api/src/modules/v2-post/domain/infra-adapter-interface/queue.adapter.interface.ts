import { QueueName } from '@libs/infra/v2-queue';

import { ContentNewsFeedAttributes } from '../../domain/repositoty-interface';

export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ProducerAttachDetachNewsfeedJobPayload = {
  content: ContentNewsFeedAttributes;
  newGroupIds: string[];
  oldGroupIds: string[];
};

export interface IQueueAdapter {
  hasJob(queueName: QueueName, jobId: string): Promise<boolean>;
  killJob(queueName: QueueName, jobId: string): Promise<void>;
  addQuizGenerateJob(quizId: string): Promise<void>;
  addQuizParticipantStartedJob(quizParticipantId: string, delayTime: number): Promise<void>;
  addProducerAttachDetachNewsfeedJob(
    payload: ProducerAttachDetachNewsfeedJobPayload
  ): Promise<void>;
}
