import { QuizDto } from '../../dto';
import { QuizEntity, QuizQuestionEntity } from '../../../domain/model/quiz';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { QuizParticipantDto } from '../../dto/quiz-participant.dto';
import { QuizQuestionDto } from '../../dto/quiz-question.dto';

export interface IQuizBinding {
  binding(quizEntity: QuizEntity): Promise<QuizDto>;
  bindQuizParticipants(quizParticipants: QuizParticipantEntity[]): Promise<QuizParticipantDto[]>;
  bindQuizQuestion(quizParticipants: QuizQuestionEntity): Promise<QuizQuestionDto>;
}
export const QUIZ_BINDING_TOKEN = 'QUIZ_BINDING_TOKEN';
