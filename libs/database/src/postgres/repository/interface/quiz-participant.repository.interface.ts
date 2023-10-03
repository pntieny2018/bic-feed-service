import { ORDER } from '@beincom/constants';
import {
  QuizParticipantAttributes,
  QuizParticipantModel,
  QuizParticipantAnswerAttributes,
  QuizParticipantAnswerModel,
} from '@libs/database/postgres/model';
import { WhereOptions } from 'sequelize';

import { CursorPaginationProps, CursorPaginationResult } from '../../common';

export type FindQuizParticipantConditionOptions = {
  ids?: string[];
  contentIds?: string[];
  createdBy?: string;
  isHighest?: boolean;
  isFinished?: boolean;
};

export type FindQuizParticipantIncludeOptions = {
  shouldInCludeAnswers?: boolean;
};

export type FindQuizParticipantAttributeOptions = {
  exclude?: (keyof QuizParticipantAttributes)[];
  include?: any[];
};

export type FindQuizParticipantOrderOptions = {
  sortColumn?: keyof QuizParticipantAttributes;
  sortBy?: ORDER;
};

export type FindQuizParticipantProps = {
  condition: FindQuizParticipantConditionOptions;
  include?: FindQuizParticipantIncludeOptions;
  attributes?: FindQuizParticipantAttributeOptions;
  orderOptions?: FindQuizParticipantOrderOptions;
  group?: string[];
};

export type GetPaginationQuizParticipantsProps = FindQuizParticipantProps & CursorPaginationProps;

export interface ILibQuizParticipantRepository {
  createQuizParticipant(quizParticipant: QuizParticipantAttributes): Promise<void>;
  updateQuizParticipant(
    quizParticipantId: string,
    quizParticipant: Partial<QuizParticipantAttributes>
  ): Promise<void>;
  findQuizParticipant(findOptions: FindQuizParticipantProps): Promise<QuizParticipantModel>;
  findAllQuizParticipants(findOptions: FindQuizParticipantProps): Promise<QuizParticipantModel[]>;
  getQuizParticipantsPagination(
    props: GetPaginationQuizParticipantsProps
  ): Promise<CursorPaginationResult<QuizParticipantModel>>;

  bulkCreateQuizParticipantAnswers(answers: QuizParticipantAnswerAttributes[]): Promise<void>;
  updateQuizParticipantAnswer(
    answerId: string,
    answer: Partial<QuizParticipantAnswerAttributes>
  ): Promise<void>;
  deleteQuizParticipantAnswer(
    conditions: WhereOptions<QuizParticipantAnswerAttributes>
  ): Promise<void>;
  findAllQuizParticipantAnswers(quizParticipantId: string): Promise<QuizParticipantAnswerModel[]>;
}

export const LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN = 'LIB_QUIZ_PARTICIPANT_REPOSITORY_TOKEN';
