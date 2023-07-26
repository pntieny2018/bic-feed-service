import { QuizParticipantEntity } from '../model/quiz-participant';

export interface IQuizParticipantRepository {
  create(quizParticipant: QuizParticipantEntity): Promise<void>;
  findOne(takeId: string): Promise<QuizParticipantEntity>;
  findAllByContentId(contentId: string, userId: string): Promise<QuizParticipantEntity[]>;
}

export const QUIZ_PARTICIPANT_REPOSITORY_TOKEN = 'QUIZ_PARTICIPANT_REPOSITORY_TOKEN';
