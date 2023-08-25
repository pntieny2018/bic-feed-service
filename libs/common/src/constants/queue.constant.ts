export const QUEUES = {
  QUIZ_PENDING: {
    QUEUE_NAME: 'QuizPending',
    JOBS: {
      PROCESS_QUIZ_PENDING: 'ProcessQuizPending',
    },
  },
  QUIZ_PARTICIPANT_RESULT: {
    QUEUE_NAME: 'QuizParticipantResult',
    JOBS: {
      PROCESS_QUIZ_PARTICIPANT_RESULT: 'ProcessQuizParticipantResult',
    },
  },
  ARTICLE_SCHEDULED: {
    QUEUE_NAME: 'ArticleScheduled',
    JOBS: {
      PROCESS_ARTICLE_SCHEDULED: 'ProcessArticleScheduled',
    },
  },
};
