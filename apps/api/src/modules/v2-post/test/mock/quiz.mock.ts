import { QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { QuizAnswerAttributes } from '@libs/database/postgres/model/quiz-answer.model';
import { QuizQuestionAttributes } from '@libs/database/postgres/model/quiz-question.model';
import { QuizAttributes } from '@libs/database/postgres/model/quiz.model';
import { v4 } from 'uuid';

import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';

export function createMockQuizRecord(data: Partial<QuizAttributes> = {}): QuizAttributes {
  const quizId = v4();
  const postId = v4();
  const ownerId = v4();

  return {
    id: quizId,
    title: 'title',
    description: 'description',
    postId,
    status: QUIZ_STATUS.PUBLISHED,
    genStatus: QUIZ_PROCESS_STATUS.PROCESSED,
    numberOfQuestions: 4,
    numberOfAnswers: 4,
    numberOfQuestionsDisplay: 3,
    isRandom: false,
    timeLimit: 1800,
    questions: [createMockQuizQuestionRecord({ quizId })],
    meta: 'meta',
    error: {
      code: '1',
      message: 'message',
    },
    createdBy: ownerId,
    updatedBy: ownerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}

export function createMockQuizQuestionRecord(
  data: Partial<QuizQuestionAttributes> = {}
): QuizQuestionAttributes {
  const questionId = v4();

  return {
    id: questionId,
    content: 'question 1',
    quizId: v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    answers: [
      createMockQuizAnswerRecord({ questionId }),
      createMockQuizAnswerRecord({ questionId, content: 'answer 2', isCorrect: false }),
    ],
    ...data,
  };
}

export function createMockQuizAnswerRecord(
  data: Partial<QuizAnswerAttributes> = {}
): QuizAnswerAttributes {
  return {
    id: v4(),
    questionId: v4(),
    content: 'answer 1',
    isCorrect: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}

export function createMockQuizEntity(data: Partial<QuizAttributes> = {}): QuizEntity {
  const quiz = createMockQuizRecord(data);
  return new QuizEntity({
    ...quiz,
    contentId: quiz.postId,
    questions: quiz.questions.map(createMockQuizQuestionEntity),
  });
}

export function createMockQuizQuestionEntity(
  data: Partial<QuizQuestionAttributes> = {}
): QuizQuestionEntity {
  const question = createMockQuizQuestionRecord(data);
  return new QuizQuestionEntity(question);
}
