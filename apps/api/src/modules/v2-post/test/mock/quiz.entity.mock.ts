import { QuizEntity, QuizQuestionAttributes, QuizQuestionEntity } from '../../domain/model/quiz';

import { quizRecordMock } from './quiz.model.mock';

export const quizEntityMock = new QuizEntity({
  ...quizRecordMock,
  questions: quizRecordMock.questions.map(
    (question) => new QuizQuestionEntity(question as QuizQuestionAttributes)
  ),
});
