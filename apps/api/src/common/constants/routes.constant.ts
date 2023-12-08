import { AppHelper } from '../helpers';

import {
  VERSION_1_5_0,
  VERSION_1_6_0,
  VERSION_1_7_0,
  VERSION_1_8_0,
  VERSION_1_9_0,
  VERSION_1_10_0,
  VERSION_1_11_0,
  VERSION_1_12_0,
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
      PATH: '/tags/:tagId',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    DELETE_TAG: {
      PATH: '/tags/:tagId',
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
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    ADD_ITEMS: {
      PATH: '/series/:seriesId/items',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    REMOVE_ITEMS: {
      PATH: '/series/:seriesId/items',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    REORDER_ITEMS: {
      PATH: '/series/:seriesId/items/order',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
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
      PATH: ['content/schedule', 'contents/schedule'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_11_0),
    },
    GET_TOTAL_DRAFT: {
      PATH: ['content/total-draft', 'contents/total-draft'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_SERIES: {
      PATH: ['content/:contentId/series', 'contents/:contentId/series'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_DRAFTS: {
      PATH: ['content/draft', 'contents/draft'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GET_REPORTS: {
      PATH: ['content/reports', 'contents/reports'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
    CREATE_REPORT: {
      PATH: ['content/:contentId/reports', 'contents/:contentId/reports'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
    GET_MENU_SETTINGS: {
      PATH: ['content/:contentId/menu-settings', 'contents/:contentId/menu-settings'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_9_0),
    },
    SEARCH_CONTENTS: {
      PATH: ['content', 'contents'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_9_0),
    },
    MARK_AS_READ: {
      PATH: ['content/:contentId/mark-as-read', 'contents/:contentId/mark-as-read'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    VALIDATE_SERIES_TAGS: {
      PATH: ['content/validate-series-tags', 'contents/validate-series-tags'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UPDATE_SETTINGS: {
      PATH: ['content/:contentId/setting', 'contents/:contentId/setting'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    REORDER_PIN_CONTENT: {
      PATH: [
        'content/pinned-content/groups/:groupId/order',
        'contents/pinned-content/groups/:groupId/order',
      ],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_PINNED_CONTENT: {
      PATH: ['content/pinned-content/groups/:groupId', 'contents/pinned-content/groups/:groupId'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    SEEN_CONTENT: {
      PATH: ['content/:contentId/seen', 'contents/:contentId/seen'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    PIN_CONTENT: {
      PATH: ['content/pinned-content/:contentId', 'contents/pinned-content/:contentId'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    GET_AUDIENCE: {
      PATH: ['content/:contentId/audiences', 'contents/:contentId/audiences'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_10_0),
    },
    SAVE_CONTENT: {
      PATH: ['content/:contentId/save', 'contents/:contentId/save'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UNSAVE_CONTENT: {
      PATH: ['content/:contentId/unsave', 'contents/:contentId/unsave'],
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
  },
  COMMENT: {
    GET_LIST: {
      PATH: '/comments',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    CREATE: {
      PATH: '/comments',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    GET_AROUND_COMMENT: {
      PATH: '/comments/:commentId',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    UPDATE: {
      PATH: '/comments/:commentId',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    DELETE: {
      PATH: '/comments/:commentId',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    REPLY: {
      PATH: '/comments/:commentId/reply',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    CREATE_REPORT: {
      PATH: 'comments/:commentId/reports',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
    GET_REPORT: {
      PATH: 'comments/:commentId/reports',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
    GET_REPORTS: {
      PATH: 'comments/reports',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
  },
  REACTION: {
    GET_LIST: {
      PATH: '/reactions',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    CREATE: {
      PATH: '/reactions',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
    DELETE: {
      PATH: '/reactions',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
  },
  MANAGE_REPORTS: {
    GET_LIST: {
      PATH: 'manage/communities/:rootGroupId/content-reports',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
    GET_DETAIL: {
      PATH: 'manage/communities/:rootGroupId/content-reports/:reportId',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
    PROCESS: {
      PATH: 'manage/communities/:rootGroupId/content-reports/:reportId/status',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_12_0),
    },
  },
  NEWSFEED: {
    GET_LIST: {
      PATH: '/newsfeed',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
  },
  TIMELINE: {
    GET_LIST_IN_GROUP: {
      PATH: '/timeline/:groupId',
      VERSIONS: AppHelper.getVersionsSupported(),
    },
  },
};
