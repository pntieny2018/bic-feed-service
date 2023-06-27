import { TagEntity } from '../../model/tag';
import { QuizEntity } from '../../model/quiz';
import { UserDto } from '../../../../v2-user/application';

export type QuizCreateProps = {
  contentId: string;
  numberOfQuestions: number;
  numberOfAnswers: number;
  authUser: UserDto;
  questions: {
    question: string;
    answers: {
      answer: string;
      isCorrect: boolean;
    }[];
  }[];
  title?: string;
  description?: string;
  numberOfQuestionsDisplay?: number;
  numberOfAnswersDisplay?: number;
  isRandom?: boolean;
  meta: any;
};

export type TagUpdateProps = {
  name: string;
  id: string;
  userId: string;
};

export interface IQuizDomainService {
  create(data: QuizCreateProps): Promise<QuizEntity>;
}
export const QUIZ_DOMAIN_SERVICE_TOKEN = 'QUIZ_DOMAIN_SERVICE_TOKEN';
