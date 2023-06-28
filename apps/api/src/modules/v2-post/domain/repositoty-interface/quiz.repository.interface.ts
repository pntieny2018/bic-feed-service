import { QuizStatus } from '../../data-type/quiz-status.enum';
import { QuizEntity } from '../model/quiz';

export type FindOneQuizProps = {
  id: string;
};

export type FindAllQuizOptions = {
  where: {
    ids?: string[];
    contentIds?: string[];
    status: QuizStatus;
  };
};

export interface IQuizRepository {
  findOne(input: FindOneQuizProps): Promise<QuizEntity>;

  findAll(findAllQuizProps: FindAllQuizOptions): Promise<QuizEntity[]>;

  update(data: QuizEntity): Promise<void>;

  create(data: QuizEntity): Promise<void>;

  delete(id: string): Promise<void>;
}

export const QUIZ_REPOSITORY_TOKEN = 'QUIZ_REPOSITORY_TOKEN';
