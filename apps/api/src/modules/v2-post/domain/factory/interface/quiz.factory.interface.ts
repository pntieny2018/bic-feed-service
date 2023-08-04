import { QuizEntity, QuizAttributes } from '../../model/quiz';
import { QuizCreateProps } from '../../domain-service/interface';
import { QuizParticipantEntity } from '../../model/quiz-participant';

export interface IQuizFactory {
  createQuiz(props: QuizCreateProps): QuizEntity;
  createTakeQuiz(userId: string, quizEntity: QuizEntity): QuizParticipantEntity;
  reconstitute(props: QuizAttributes): QuizEntity;
}
export const QUIZ_FACTORY_TOKEN = 'QUIZ_FACTORY_TOKEN';
