export const PERMISSION_KEY = {
  CRUD_POST_ARTICLE: 'crud_post_article',
  CRUD_SERIES: 'crud_series',
  //ASSIGN_CONTENT_OWNER: 'assign_content_owner',
  //EDIT_POST_OF_INACTIVE_USER: 'edit_post_of_inactive_user',
  EDIT_OWN_CONTENT_SETTING: 'edit_own_content_setting',
  //PUBLISH_UNPUBLISH_POST: 'publish_unpublish_post',
  PIN_CONTENT: 'pin_content',
};

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
  IS_RUNNING_ARTICLE_SCHEDULE: 'is_running_article_schedule',
};

export class BasicPermissionDto {
  public key: string;
  public name: string;
  public description: string;
}

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
