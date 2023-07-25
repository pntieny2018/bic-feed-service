import { QuizEntity, QuizProps } from '../../model/quiz';
import { QuizCreateProps } from '../../domain-service/interface/quiz.domain-service.interface';
import { TakeQuizEntity } from '../../model/user-taking-quiz';

export interface IQuizFactory {
  createQuiz(props: QuizCreateProps): QuizEntity;
  createTakeQuiz(userId: string, quizEntity: QuizEntity): TakeQuizEntity;

  reconstitute(props: QuizProps): QuizEntity;
}
export const QUIZ_FACTORY_TOKEN = 'QUIZ_FACTORY_TOKEN';
