export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ContentScheduledJobPayload = {
  contentId: string;
  ownerId: string;
};

export interface IQueueAdapter {
  addQuizParticipantStartedJob(quizParticipantId: string, delayTime: number): Promise<void>;
  addContentScheduledJobs(payload: ContentScheduledJobPayload[]): Promise<void>;
}
