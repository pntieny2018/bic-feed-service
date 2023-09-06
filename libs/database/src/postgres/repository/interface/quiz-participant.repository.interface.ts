import { ORDER } from '@beincom/constants';
import {
  QuizParticipantAttributes,
  QuizParticipantModel,
} from '@libs/database/postgres/model/quiz-participant.model';
import { WhereOptions } from 'sequelize';

import {
  QuizParticipantAnswerAttributes,
  QuizParticipantAnswerModel,
} from '../../model/quiz-participant-answers.model';

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
  order?: FindQuizParticipantOrderOptions;
  group?: string[];
};

export interface ILibQuizParticipantRepository {
  createQuizParticipant(quizParticipant: QuizParticipantAttributes): Promise<void>;
  updateQuizParticipant(
    quizParticipantId: string,
    quizParticipant: Partial<QuizParticipantAttributes>
  ): Promise<void>;
  findQuizParticipant(findOptions: FindQuizParticipantProps): Promise<QuizParticipantModel>;

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
