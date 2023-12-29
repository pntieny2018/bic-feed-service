import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';

import { QuizParticipantEntity } from '../model/quiz-participant';

export interface IQuizParticipantRepository {
  create(quizParticipant: QuizParticipantEntity): Promise<void>;
  update(quizParticipant: QuizParticipantEntity): Promise<void>;
  updateIsHighest(quizParticipantId: string, isHighest: boolean): Promise<void>;

  findQuizParticipantById(quizParticipantId: string): Promise<QuizParticipantEntity | null>;
  getQuizParticipantById(quizParticipantId: string): Promise<QuizParticipantEntity>;
  findAllByContentId(contentId: string, userId: string): Promise<QuizParticipantEntity[]>;

  findQuizParticipantHighestScoreByContentIdAndUserId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity>;
  findQuizParticipantDoingByContentIdAndUserId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity>;

  findQuizParticipantHighestScoreByContentIdsAndUserId(
    contentIds: string[],
    userId: string
  ): Promise<QuizParticipantEntity[]>;

  findQuizParticipantDoingByContentIdsAndUserId(
    contentIds: string[],
    userId: string
  ): Promise<QuizParticipantEntity[]>;

  getQuizParticipantHighestScoreGroupByUserId(
    contentId: string
  ): Promise<{ createdBy: string; score: number }[]>;
  getPaginationQuizParticipantHighestScoreGroupByUserId(
    contentId: string,
    paginationProps: CursorPaginationProps
  ): Promise<CursorPaginationResult<QuizParticipantEntity>>;
}

export const QUIZ_PARTICIPANT_REPOSITORY_TOKEN = 'QUIZ_PARTICIPANT_REPOSITORY_TOKEN';
