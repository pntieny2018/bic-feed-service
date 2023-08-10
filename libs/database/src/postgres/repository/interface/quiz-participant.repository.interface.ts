import {
  QuizParticipantAttributes,
  QuizParticipantModel,
} from '@app/database/postgres/model/quiz-participant.model';

export interface ILibQuizParticipantRepository {
  create(quizParticipant: QuizParticipantAttributes): Promise<void>;
  update(
    quizParticipantId: string,
    quizParticipant: Partial<QuizParticipantAttributes>
  ): Promise<void>;
  findOne(takeId: string): Promise<QuizParticipantModel>;
  findAllByContentId(contentId: string, userId: string): Promise<QuizParticipantModel[]>;
  getQuizParticipantHighestScoreGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantModel>>;
  getQuizParticipantsDoingGroupByContentId(
    contentIds: string[],
    userId: string
  ): Promise<Map<string, QuizParticipantModel>>;
}

export const LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN = 'LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN';
