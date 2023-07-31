import { QuizDto } from '../../dto';
import { QuizEntity } from '../../../domain/model/quiz';

export interface IQuizBinding {
  binding(quizEntity: QuizEntity): Promise<QuizDto>;
}
export const QUIZ_BINDING_TOKEN = 'QUIZ_BINDING_TOKEN';
