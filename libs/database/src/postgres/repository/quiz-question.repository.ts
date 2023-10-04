import { QuizQuestionModel } from '@libs/database/postgres/model';
import { BaseRepository } from '@libs/database/postgres/repository';

export class LibQuizQuestionRepository extends BaseRepository<QuizQuestionModel> {
  public constructor() {
    super(QuizQuestionModel);
  }
}
