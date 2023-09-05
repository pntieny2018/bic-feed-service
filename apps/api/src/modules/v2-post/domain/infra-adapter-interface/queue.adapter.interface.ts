import { UserDto } from '@libs/service/user';

export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ArticleScheduledJobPayload = {
  articleId: string;
  articleOwner: UserDto;
};

export interface IQueueAdapter {
  addQuizParticipantStartedJob(quizParticipantId: string, delayTime: number): Promise<void>;
  addArticleScheduledJobs(payload: ArticleScheduledJobPayload[]): Promise<void>;
}
