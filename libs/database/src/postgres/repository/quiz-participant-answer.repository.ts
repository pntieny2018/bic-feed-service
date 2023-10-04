import { QuizParticipantAnswerModel } from '../../postgres/model/quiz-participant-answers.model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibQuizParticipantAnswerRepository extends BaseRepository<QuizParticipantAnswerModel> {
  public constructor() {
    super(QuizParticipantAnswerModel);
  }
  ø;
}
