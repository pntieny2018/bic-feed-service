import { UserDto } from '@libs/service/user';

export const QUEUE_ADAPTER = 'QUEUE_ADAPTER';

export type ContentScheduledJobPayload = {
  contentId: string;
  contentOwner: UserDto;
};

export interface IQueueAdapter {
  addQuizParticipantStartedJob(quizParticipantId: string, delayTime: number): Promise<void>;
  addContentScheduledJob(payload: ContentScheduledJobPayload[]): Promise<void>;
}
