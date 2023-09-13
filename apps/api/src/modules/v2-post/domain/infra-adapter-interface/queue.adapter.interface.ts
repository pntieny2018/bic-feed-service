export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ArticleScheduledJobPayload = {
  articleId: string;
  articleOwnerId: string;
};

export interface IQueueAdapter {
  addQuizParticipantStartedJob(quizParticipantId: string, delayTime: number): Promise<void>;
  addArticleScheduledJobs(payload: ArticleScheduledJobPayload[]): Promise<void>;
}
