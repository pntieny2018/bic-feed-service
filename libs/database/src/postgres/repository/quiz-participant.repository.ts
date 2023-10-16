import { QuizParticipantModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibQuizParticipantRepository extends BaseRepository<QuizParticipantModel> {
  public constructor() {
    super(QuizParticipantModel);
  }

  public getConditionIsFinished(): string {
    return 'finished_at IS NOT NULL';
  }
  public getConditionIsNotFinished(): string {
    return 'finished_at IS NULL';
  }
}
