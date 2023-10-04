import { QuizParticipantModel } from '../../postgres/model/quiz-participant.model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibQuizParticipantRepository extends BaseRepository<QuizParticipantModel> {
  public constructor() {
    super(QuizParticipantModel);
  }

  public getConditionIsFinished(): string {
    return "finished_at IS NOT NULL OR started_at + time_limit * interval '1 second' <= NOW()";
  }
  public getConditionIsNotFinished(): string {
    return "finished_at IS NULL OR started_at + time_limit * interval '1 second' > NOW()";
  }
}
