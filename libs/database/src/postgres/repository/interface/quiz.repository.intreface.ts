import { CONTENT_TYPE, ORDER, QUIZ_STATUS } from '@beincom/constants';
import { WhereOptions } from 'sequelize';

import { CursorPaginationProps, CursorPaginationResult } from '../../common';
import { QuizAnswerAttributes } from '../../model/quiz-answer.model';
import { QuizQuestionAttributes } from '../../model/quiz-question.model';
import { QuizAttributes, QuizModel } from '../../model/quiz.model';

export type FindQuizConditionOptions = {
  ids?: string[];
  contentIds?: string[];
  status?: QUIZ_STATUS;
  createdBy?: string;
};

export type FindQuizIncludeOptions = {
  shouldInCludeQuestions?: boolean;
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
  deleteQuizQuestion(conditions: WhereOptions<QuizQuestionAttributes>): Promise<void>;

  bulkCreateQuizAnswers(answers: QuizAnswerAttributes[]): Promise<void>;
}

export const LIB_QUIZ_REPOSITORY_TOKEN = 'LIB_QUIZ_REPOSITORY_TOKEN';
