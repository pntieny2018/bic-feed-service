import { QUIZ_PROCESS_STATUS } from '@beincom/constants';

export const QUIZ_EVENT_APPLICATION_SERVICE = 'QUIZ_EVENT_APPLICATION_SERVICE';

export type QuizProcessedEventPayload = {
  recipients: string[];
  quizId: string;
  description?: string;
  genStatus: QUIZ_PROCESS_STATUS;
};

export interface IQuizEventApplicationService {
  emitQuizProcessedEvent(payload: QuizProcessedEventPayload): Promise<void>;
}
