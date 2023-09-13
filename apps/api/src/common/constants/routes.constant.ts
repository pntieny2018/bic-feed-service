import { AppHelper } from '../helpers/app.helper';

import {
  VERSION_1_10_0,
  VERSION_1_5_0,
  VERSION_1_6_0,
  VERSION_1_7_0,
  VERSION_1_8_0,
} from './app.constant';

export const ROUTES = {
  TAG: {
    GET_TAGS: {
      PATH: '/tags',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    SEARCH_TAGS: {
      PATH: '/tags/search',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    CREATE_TAG: {
      PATH: '/tags',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    UPDATE_TAG: {
      PATH: '/tags/:id',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    DELETE_TAG: {
      PATH: '/tags/:id',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
  },
  SERIES: {
    CREATE: {
      PATH: '/series',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UPDATE: {
      PATH: '/series/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GET_DETAIL: {
      PATH: '/series/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    DELETE: {
      PATH: '/series/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GET_ITEMS_BY_SERIES: {
      PATH: '/series/items',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
  },
  ARTICLE: {
    CREATE: {
      PATH: '/articles',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UPDATE: {
      PATH: '/articles/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_6_0),
    },
    AUTO_SAVE: {
      PATH: '/articles/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_6_0),
    },
    PUBLISH: {
      PATH: '/articles/:id/publish',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_6_0),
    },
    SCHEDULE: {
      PATH: '/articles/:id/schedule',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_7_0),
    },
    GET_DETAIL: {
      PATH: '/articles/:id([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    DELETE: {
      PATH: '/articles/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GET_SCHEDULE: {
      PATH: '/articles/schedule',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
  },
  QUIZ: {
    GET_QUIZZES: {
      PATH: '/quizzes',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    CREATE: {
      PATH: '/quizzes',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    GENERATE: {
      PATH: '/quizzes/:id/generate',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    GET_QUIZ_SUMMARY: {
      PATH: '/quizzes/:contentId/summary',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    GET_QUIZ_PARTICIPANTS: {
      PATH: '/quizzes/:contentId/participants',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    UPDATE: {
      PATH: '/quizzes/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    DELETE: {
      PATH: '/quizzes/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    GET_QUIZ_DETAIL: {
      PATH: '/quizzes/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },

    START_QUIZ: {
      PATH: '/quiz-participant/:id/start',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    UPDATE_QUIZ_ANSWER: {
      PATH: '/quiz-participant/:id/answers',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    GET_QUIZ_RESULT: {
      PATH: '/quiz-participant/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    ADD_QUIZ_QUESTION: {
      PATH: '/quizzes/:quizId/questions',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    UPDATE_QUIZ_QUESTION: {
      PATH: '/quizzes/:quizId/questions/:questionId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    DELETE_QUIZ_QUESTION: {
      PATH: '/quizzes/:quizId/questions/:questionId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
  },
};
