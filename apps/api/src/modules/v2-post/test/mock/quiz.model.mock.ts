import { QuizGenStatus, QuizStatus } from '../../data-type';

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
  isRandom: false,
  timeLimit: 1800,
  questions: [
    {
      id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae9',
      content: 'question 1',
      quizId: 'ff09eb67-3319-4c0a-9e15-04cf14358ae7',
      createdAt: new Date(),
      updatedAt: new Date(),
      answers: [
        {
          id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae2',
          content: 'answer 1',
          isCorrect: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'ff09eb67-3319-4c0a-9e15-04cf14358ae3',
          content: 'answer 2',
          isCorrect: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  ],
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
