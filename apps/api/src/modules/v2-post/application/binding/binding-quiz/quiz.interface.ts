import { QuizDto } from '../../dto';
import { QuizEntity } from '../../../domain/model/quiz';
import { QuizParticipantEntity } from '../../../domain/model/quiz-participant';
import { QuizParticipantDto } from '../../dto/quiz-participant.dto';

export interface IQuizBinding {
  binding(quizEntity: QuizEntity): Promise<QuizDto>;
  bindQuizParticipants(quizParticipants: QuizParticipantEntity[]): Promise<QuizParticipantDto[]>;
}
export const QUIZ_BINDING_TOKEN = 'QUIZ_BINDING_TOKEN';
