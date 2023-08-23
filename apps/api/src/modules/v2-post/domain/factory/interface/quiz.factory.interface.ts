import { QuizEntity, QuizProps, QuizQuestionEntity } from '../../model/quiz';
import { AddQuestionProps, QuizCreateProps } from '../../domain-service/interface';
import { QuizParticipantEntity } from '../../model/quiz-participant';
export interface IQuizFactory {
  createQuiz(props: QuizCreateProps): QuizEntity;
  createQuizQuestion(props: AddQuestionProps): QuizQuestionEntity;
  createTakeQuiz(userId: string, quizEntity: QuizEntity): QuizParticipantEntity;
  reconstitute(props: QuizProps): QuizEntity;
}
export const QUIZ_FACTORY_TOKEN = 'QUIZ_FACTORY_TOKEN';
