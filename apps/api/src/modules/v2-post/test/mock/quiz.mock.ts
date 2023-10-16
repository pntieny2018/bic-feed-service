/* eslint-disable unused-imports/no-unused-vars */
import { QUIZ_PROCESS_STATUS, QUIZ_STATUS } from '@beincom/constants';
import { QuizAnswerAttributes } from '@libs/database/postgres/model/quiz-answer.model';
import { QuizParticipantAttributes } from '@libs/database/postgres/model/quiz-participant.model';
import { QuizQuestionAttributes } from '@libs/database/postgres/model/quiz-question.model';
import { QuizAttributes } from '@libs/database/postgres/model/quiz.model';
import { v4 } from 'uuid';

import { QuizEntity, QuizQuestionEntity } from '../../domain/model/quiz';
import { QuizParticipantEntity } from '../../domain/model/quiz-participant';

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

export function createMockQuizParticipationRecord(
  data: Partial<QuizParticipantAttributes> = {}
): QuizParticipantAttributes {
  const quiz = createMockQuizRecord();
  return {
    id: v4(),
    quizId: quiz.id,
    postId: v4(),
    score: 0,
    isHighest: false,
    timeLimit: 1800,
    totalAnswers: 0,
    totalCorrectAnswers: 0,
    startedAt: new Date(),
    finishedAt: null,
    quizSnapshot: {
      title: quiz.title,
      description: quiz.description,
      questions: quiz.questions.map(({ quizId, ...question }) => ({
        ...question,
        answers: question.answers.map(({ questionId, ...answer }) => answer),
      })),
    },
    createdBy: v4(),
    updatedBy: v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    answers: [],
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

export function createMockQuizParticipantEntity(
  data: Partial<QuizParticipantAttributes> = {}
): QuizParticipantEntity {
  const participant = createMockQuizParticipationRecord(data);
  const { postId, ...rest } = participant;
  return new QuizParticipantEntity({ ...rest, contentId: postId });
}
