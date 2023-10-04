import { QuizQuestionModel } from '../model/quiz-question.model';
import { BaseRepository } from '@libs/database/postgres/repository/base.repository';

export class LibQuizQuestionRepository extends BaseRepository<QuizQuestionModel> {
  public constructor() {
    super(QuizQuestionModel);
  }
}
