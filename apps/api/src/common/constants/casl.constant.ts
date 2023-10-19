import { PERMISSION_KEY } from '@beincom/constants';

export const SUBJECT = {
  COMMUNITY: 'community',
  GROUP: 'group',
};

export const CACHE_KEYS = {
  USER_PERMISSIONS: 'bg_user_permissions',
  USER_PROFILE: 'bg_profile',
  REPORT_REASON_TYPE: 'report_reason_type',
  SHARE_USER: 'SU',
  SHARE_GROUP: 'SG',
  IS_RUNNING_CONTENT_SCHEDULE: 'is_running_content_schedule',
};

export const permissionToCommonName = (permission: string): string => {
  switch (permission) {
    case PERMISSION_KEY.CRUD_POST_ARTICLE:
      return 'CRUD post';
    case PERMISSION_KEY.CRUD_SERIES:
      return 'CRUD series';
    case PERMISSION_KEY.EDIT_OWN_CONTENT_SETTING:
      return 'own content setting';
    default:
      return 'undefined';
  }
};
