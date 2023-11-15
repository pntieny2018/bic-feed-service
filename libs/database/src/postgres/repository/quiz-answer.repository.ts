import { QuizAnswerModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibQuizAnswerRepository extends BaseRepository<QuizAnswerModel> {
  public constructor() {
    super(QuizAnswerModel);
  }
}
