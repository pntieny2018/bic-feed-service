import { AppHelper } from '../helpers/app.helper';
import { VERSION_1_3_0 } from './app.constant';

export const ROUTES = {
  TAG: {
    GET_TAGS: {
      PATH: '/tags',
      VERSIONS: AppHelper.getVersionsSupportedFrom(VERSION_1_3_0),
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
};
