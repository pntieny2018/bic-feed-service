import { QuizModel } from '../model/quiz.model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibQuizRepository extends BaseRepository<QuizModel> {
  public constructor() {
    super(QuizModel);
  }
}
