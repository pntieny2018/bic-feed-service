import { CONTENT_TYPE, ORDER, QUIZ_STATUS } from '@beincom/constants';
import { CursorPaginationProps, CursorPaginationResult } from '@libs/database/postgres/common';
import {
  QuizAttributes,
  QuizAnswerAttributes,
  QuizQuestionAttributes,
  QuizQuestionModel,
  QuizModel,
} from '@libs/database/postgres/model';
import { WhereOptions } from 'sequelize';

export type FindQuizConditionOptions = {
  ids?: string[];
  contentIds?: string[];
  status?: QUIZ_STATUS;
  createdBy?: string;
};

export type FindQuizIncludeOptions = {
  shouldIncludeQuestions?: boolean;
  shouldIncludeContent?: {
    contentType?: CONTENT_TYPE;
  };
};

export type FindQuizAttributeOptions = {
  exclude?: (keyof QuizAttributes)[];
  include?: any[];
};

export type FindQuizOrderOptions = {
  sortColumn?: keyof QuizAttributes;
  sortBy?: ORDER;
};

export type FindQuizProps = {
  condition: FindQuizConditionOptions;
  include?: FindQuizIncludeOptions;
  attributes?: FindQuizAttributeOptions;
  orderOptions?: FindQuizOrderOptions;
  group?: string[];
};

export type GetPaginationQuizzesProps = FindQuizProps & CursorPaginationProps;

export type FindQuizQuestionConditionOptions = {
  ids?: string[];
  quizId?: string;
};

export type FindQuizQuestionIncludeOptions = {
  shouldIncludeAnswers?: boolean;
};

export type FindQuizQuestionProps = {
  condition: FindQuizQuestionConditionOptions;
  include?: FindQuizQuestionIncludeOptions;
};

export interface ILibQuizRepository {
  createQuiz(quiz: QuizAttributes): Promise<void>;
  updateQuiz(quizId: string, quiz: Partial<QuizAttributes>): Promise<void>;
  deleteQuiz(conditions: WhereOptions<QuizAttributes>): Promise<void>;
  findQuiz(findOptions: FindQuizProps): Promise<QuizModel>;
  findAllQuizzes(findOptions: FindQuizProps): Promise<QuizModel[]>;
  getQuizzesPagination(
    getPaginationQuizzesProps: GetPaginationQuizzesProps
  ): Promise<CursorPaginationResult<QuizModel>>;

  bulkCreateQuizQuestions(questions: QuizQuestionAttributes[]): Promise<void>;
  updateQuizQuestion(questionId: string, question: Partial<QuizQuestionAttributes>): Promise<void>;
  deleteQuizQuestion(conditions: WhereOptions<QuizQuestionAttributes>): Promise<void>;
  findQuizQuestion(findOptions: FindQuizQuestionProps): Promise<QuizQuestionModel>;

  bulkCreateQuizAnswers(answers: QuizAnswerAttributes[]): Promise<void>;
  deleteQuizAnswer(conditions: WhereOptions<QuizAnswerAttributes>): Promise<void>;
}

export const LIB_QUIZ_REPOSITORY_TOKEN = 'LIB_QUIZ_REPOSITORY_TOKEN';
