import { QuizGenStatus, QuizStatus } from '../../data-type';
import { Question } from '../../domain/model/quiz';

export const quizRecordMock = {
  id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
  title: 'title',
  description: 'description',
  contentId: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
  status: QuizStatus.PUBLISHED,
  genStatus: QuizGenStatus.PROCESSED,
  numberOfQuestions: 4,
  numberOfAnswers: 4,
  numberOfQuestionsDisplay: 3,
  numberOfAnswersDisplay: 3,
  isRandom: false,
  timeLimit: 1800,
  questions: [
    {
      id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae9',
      question: 'question 1',
      answers: [
        {
          id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae2',
          answer: 'answer 1',
          isCorrect: true,
        },
        {
          id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae3',
          answer: 'answer 2',
          isCorrect: false,
        },
      ],
    },
  ] as Question[],
  meta: 'meta',
  error: {
    code: '1',
    message: 'message',
  },
  createdBy: '32866f20-65f9-4580-86db-6d4f6388b8ac',
  updatedBy: '32866f20-65f9-4580-86db-6d4f6388b8ac',
  createdAt: new Date(),
  updatedAt: new Date(),
};
