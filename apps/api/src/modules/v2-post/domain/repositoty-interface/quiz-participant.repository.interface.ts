import { CursorPaginationProps } from '../../../../common/types/cursor-pagination-props.type';
import { CursorPaginationResult } from '../../../../common/types/cursor-pagination-result.type';
import { QuizParticipantEntity } from '../model/quiz-participant';

export interface IQuizParticipantRepository {
  create(quizParticipant: QuizParticipantEntity): Promise<void>;
  update(quizParticipant: QuizParticipantEntity): Promise<void>;
  findOne(takeId: string): Promise<QuizParticipantEntity>;
  findAllByContentId(contentId: string, userId: string): Promise<QuizParticipantEntity[]>;
  findQuizParticipantHighestScoreByContentIdAndUserId(
    contentId: string,
    userId: string
  ): Promise<QuizParticipantEntity>;
  getHighestScoreOfMember(contentId: string): Promise<{ createdBy: string; score: number }[]>;
  getQuizParticipantHighestScoreGroupByUserId(
    contentId: string,
    paginationProps: CursorPaginationProps
  ): Promise<CursorPaginationResult<QuizParticipantEntity>>;
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
