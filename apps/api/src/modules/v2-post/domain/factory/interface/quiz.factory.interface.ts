import { QuizEntity, QuizProps } from '../../model/quiz';
import { QuizCreateProps } from '../../domain-service/interface/quiz.domain-service.interface';

export interface IQuizFactory {
  create(props: QuizCreateProps): QuizEntity;

  reconstitute(props: QuizProps): QuizEntity;
}
export const QUIZ_FACTORY_TOKEN = 'QUIZ_FACTORY_TOKEN';
