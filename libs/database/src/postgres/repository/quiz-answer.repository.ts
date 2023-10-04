import { BaseRepository } from '@libs/database/postgres/repository/base.repository';
import { QuizAnswerModel } from '@libs/database/postgres/model/quiz-answer.model';

export class LibQuizAnswerRepository extends BaseRepository<QuizAnswerModel> {
  public constructor() {
    super(QuizAnswerModel);
  }
}
