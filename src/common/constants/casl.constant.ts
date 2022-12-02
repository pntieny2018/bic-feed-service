export const PERMISSION_KEY = {
  CRUD_POST_ARTICLE: 'crud_post_article',
  CRUD_SERIES: 'crud_series',
  //ASSIGN_CONTENT_OWNER: 'assign_content_owner',
  //EDIT_POST_OF_INACTIVE_USER: 'edit_post_of_inactive_user',
  EDIT_POST_SETTING: 'edit_post_setting',
  //PUBLISH_UNPUBLISH_POST: 'publish_unpublish_post',
};

export const SUBJECT = {
  COMMUNITY: 'community',
  GROUP: 'group',
};

export const CACHE_KEYS = {
  USER_PERMISSIONS: 'bg_user_permissions',
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
    case PERMISSION_KEY.EDIT_POST_SETTING:
      return 'post setting';
    default:
      return 'undefined';
  }
};
