import { QuizParticipantEntity } from '../model/quiz-participant';

export interface IQuizParticipantRepository {
  create(quizParticipant: QuizParticipantEntity): Promise<void>;
  update(quizParticipant: QuizParticipantEntity): Promise<void>;
  findOne(takeId: string): Promise<QuizParticipantEntity>;
  findAllByContentId(contentId: string, userId: string): Promise<QuizParticipantEntity[]>;
  getHighestScoreOfMember(contentId: string): Promise<{ createdBy: string; score: number }[]>;
  getQuizParticipantHighestScoreGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>>;
  getQuizParticipantsDoingGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantEntity>>;
}

export const QUIZ_PARTICIPANT_REPOSITORY_TOKEN = 'QUIZ_PARTICIPANT_REPOSITORY_TOKEN';
