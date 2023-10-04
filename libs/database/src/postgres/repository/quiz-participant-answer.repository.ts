import { QuizParticipantAnswerModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibQuizParticipantAnswerRepository extends BaseRepository<QuizParticipantAnswerModel> {
  public constructor() {
    super(QuizParticipantAnswerModel);
  }
}
