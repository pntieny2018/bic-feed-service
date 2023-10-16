import { AppHelper } from '../helpers';

import {
  VERSION_1_5_0,
  VERSION_1_6_0,
  VERSION_1_7_0,
  VERSION_1_8_0,
  VERSION_1_9_0,
  VERSION_1_10_0,
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
    SEARCH_SERIES: {
      PATH: '/series',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    SEARCH_CONTENTS_BY_SERIES: {
      PATH: '/series/:seriesId/contents',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
  },
  POST: {
    CREATE: {
      PATH: '/posts',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UPDATE: {
      PATH: '/posts/:postId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    AUTO_SAVE: {
      PATH: '/posts/:postId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GET_DETAIL: {
      PATH: '/posts/:postId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    PUBLISH: {
      PATH: '/posts/:postId/publish',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    SCHEDULE: {
      PATH: '/posts/:postId/schedule',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    DELETE: {
      PATH: '/posts/:postId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
  },
  ARTICLE: {
    CREATE: {
      PATH: '/articles',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UPDATE: {
      PATH: '/articles/:articleId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_6_0),
    },
    AUTO_SAVE: {
      PATH: '/articles/:articleId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_6_0),
    },
    PUBLISH: {
      PATH: '/articles/:articleId/publish',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_6_0),
    },
    SCHEDULE: {
      PATH: '/articles/:articleId/schedule',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_7_0),
    },
    GET_DETAIL: {
      PATH: '/articles/:articleId([a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12})',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    DELETE: {
      PATH: '/articles/:articleId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
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
      PATH: '/quizzes/:quizId/generate',
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
      PATH: '/quizzes/:quizId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    DELETE: {
      PATH: '/quizzes/:quizId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    GET_QUIZ_DETAIL: {
      PATH: '/quizzes/:quizId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },

    START_QUIZ: {
      PATH: '/quiz-participant/:quizId/start',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    UPDATE_QUIZ_ANSWER: {
      PATH: '/quiz-participant/:quizParticipantId/answers',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_8_0),
    },
    GET_QUIZ_RESULT: {
      PATH: '/quiz-participant/:quizParticipantId',
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
  CONTENT: {
    GET_SCHEDULE: {
      PATH: '/schedule',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_TOTAL_DRAFT: {
      PATH: '/total-draft',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_SERIES: {
      PATH: '/:contentId/series',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_DRAFTS: {
      PATH: '/draft',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GET_MENU_SETTINGS: {
      PATH: '/:contentId/menu-settings',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_9_0),
    },
    SEARCH_CONTENTS: {
      PATH: '/',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_9_0),
    },
    MARK_AS_READ: {
      PATH: '/:contentId/mark-as-read',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    VALIDATE_SERIES_TAGS: {
      PATH: '/validate-series-tags',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UPDATE_SETTINGS: {
      PATH: '/:contentId/setting',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    REORDER_PIN_CONTENT: {
      PATH: '/pinned-content/groups/:groupId/order',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_PINNED_CONTENT: {
      PATH: '/pinned-content/groups/:groupId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    PIN_CONTENT: {
      PATH: '/pinned-content/:contentId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
  },
};
