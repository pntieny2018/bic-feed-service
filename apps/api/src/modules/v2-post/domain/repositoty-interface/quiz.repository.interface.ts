import { QuizStatus } from '../../data-type';
import { QuizEntity } from '../model/quiz';

export type FindOneQuizProps = {
  id: string;
};

export type FindAllQuizProps = {
  ids?: string[];
  status: QuizStatus;
  contentId?: string;
  contentIds?: string[];
};

export interface IQuizRepository {
  findOne(input: FindOneQuizProps): Promise<QuizEntity>;

  findAll(input: FindAllQuizProps): Promise<QuizEntity[]>;

  update(data: QuizEntity): Promise<void>;

  create(data: QuizEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const QUIZ_REPOSITORY_TOKEN = 'QUIZ_REPOSITORY_TOKEN';
