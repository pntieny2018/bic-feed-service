import { AppHelper } from '../helpers/app.helper';
import { VERSION_1_3_0, VERSION_1_4_0, VERSION_1_5_0 } from './app.constant';

export const ROUTES = {
  TAG: {
    GET_TAGS: {
      PATH: '/tags',
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
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_4_0),
    },
    UPDATE: {
      PATH: '/series/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_4_0),
    },
    GET_DETAIL: {
      PATH: '/series/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_4_0),
    },
    DELETE: {
      PATH: '/series/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_4_0),
    },
    GET_ITEMS_BY_SERIES: {
      PATH: '/series/items',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
  },
  ARTICLE: {
    CREATE: {
      PATH: '/articles',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_4_0),
    },
    GET_DETAIL: {
      PATH: '/articles/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_4_0),
    },
    DELETE: {
      PATH: '/articles/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
  },
  QUIZ: {
    GET_DRAFT: {
      PATH: '/quizzes/draft',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    CREATE: {
      PATH: '/quizzes',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GENERATE: {
      PATH: '/quizzes/:id/generate',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    UPDATE: {
      PATH: '/quizzes/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
    GET_QUIZ_DETAIL: {
      PATH: '/quizzes/:id',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_5_0),
    },
  },
};
