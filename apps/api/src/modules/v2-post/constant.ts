export const RULES = {
  LIMIT_ATTACHED_SERIES: 3,
  TAG_MAX_NAME: 32,
  TAG_MIN_NAME: 3,
  QUIZ_TITLE_MAX_LENGTH: 65,
  QUIZ_DESCRIPTION_MAX_LENGTH: 255,
  QUIZ_MAX_QUESTION: 50,
  QUIZ_MAX_ANSWER: 6,
  QUIZ_TIME_LIMIT_DEFAULT: 30 * 60, // 5 minutes
  QUIZ_TIME_LIMIT_BUFFER: 5, // 5 seconds
  MAX_POST_CONTENT_CHARACTER: 10000,
  MAX_ARTICLE_CONTENT_CHARACTER: 50000,
  MAX_COMMENT_CHARACTER: 2000,
};

export const STATIC_WELCOME_CONTENTS = [
  {
    title: 'Welcome to Beincom (BIC)',
    list: [
      {
        id: '0d5926e9-f018-4ea0-bf42-fbceafe8542c',
      },
      {
        id: '8ca971c3-922d-4a60-9ee9-3bba4ce47f44',
      },
    ],
  },
  {
    title: 'Beincom (BIC) Project',
    list: [
      {
        id: '472e6773-7d30-4125-bcdf-de1c8b17b168',
      },
      {
        id: 'ce5ea86d-7b7a-44be-9a32-e5d6606d62d2',
      },
      {
        id: 'a50a1d6e-6116-4591-8634-05d7895a3225',
      },
    ],
  },
];
