import { AddQuestionProps, QuizCreateProps } from '../../domain-service/interface';
import { QuizEntity, QuizAttributes, QuizQuestionEntity } from '../../model/quiz';

export interface IQuizFactory {
  createQuiz(props: QuizCreateProps): QuizEntity;
  createQuizQuestion(props: AddQuestionProps): QuizQuestionEntity;
  reconstitute(props: QuizAttributes): QuizEntity;
}
export const QUIZ_FACTORY_TOKEN = 'QUIZ_FACTORY_TOKEN';
