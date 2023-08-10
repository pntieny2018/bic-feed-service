export const QUEUES_NAME = {
  QUIZ_PENDING: 'QuizPending',
  QUIZ_PARTICIPANT_RESULT: 'QuizParticipantResult',
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};
