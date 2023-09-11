import { AddQuestionProps } from '../../domain-service/interface';
import { QuizEntity, QuizAttributes, QuizQuestionEntity } from '../../model/quiz';

export interface IQuizFactory {
  createQuizQuestion(props: AddQuestionProps): QuizQuestionEntity;
  reconstitute(props: QuizAttributes): QuizEntity;
}
export const QUIZ_FACTORY_TOKEN = 'QUIZ_FACTORY_TOKEN';
