import { QuizModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibQuizRepository extends BaseRepository<QuizModel> {
  public constructor() {
    super(QuizModel);
  }
}
