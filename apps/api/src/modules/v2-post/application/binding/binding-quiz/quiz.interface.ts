import { QuizEntity, QuizQuestionEntity } from '../../../domain/model/quiz';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { QuestionDto, QuizDto, QuizParticipantDto } from '../../dto';

export interface IQuizBinding {
  binding(quizEntity: QuizEntity): QuizDto;
  bindQuizParticipants(quizParticipants: QuizParticipantEntity[]): Promise<QuizParticipantDto[]>;
  bindQuizQuestion(quizParticipants: QuizQuestionEntity): Promise<QuestionDto>;
}
export const QUIZ_BINDING_TOKEN = 'QUIZ_BINDING_TOKEN';
