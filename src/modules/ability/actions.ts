export const PERMISSION_KEY = {
  // COMMUNITY scope
  CRUD_COMMUNITY_OVERRIDE_SCHEME: 'crud_community_override_scheme',
  CREATE_COMMUNITY: 'create_community',
  ADD_REMOVE_COMMUNITY_MEMBER: 'add_remove_community_members',
  APPROVE_REJECT_COMMUNITY_JOINING_REQUESTS: 'approve_reject_community_joining_requests',
  ASSIGN_UNASSIGN_ROLE_IN_COMMUNITY: 'assign_unassign_role_in_community',
  CREATE_INNER_GROUPS: 'create_inner_groups',
  DELETE_OWN_INNER_GROUPS: 'delete_own_inner_groups',
  DELETE_OTHERS_INNER_GROUPS: 'delete_others_inner_groups',
  TRANSFER_COMMUNITY: 'transfer_community',
  DELETE_COMMUNITY_PERMANENTLY: 'delete_community_permanently',
  DEACTIVATE_ACTIVATE_COMMUNITY_TEMP: 'deactivate_activate_community_temporarily',
  VIEW_REPORTED_MEMBERS_IN_COMMUNITY: 'view_reported_members_in_community',
  REPORT_MEMBER_IN_COMMUNITY: 'report_member_in_community',
  EDIT_COMMUNITY_INFO: 'edit_community_information',
  EDIT_COMMUNITY_PRIVACY: 'edit_community_privacy',
  EDIT_COMMUNITY_JOIN_POLICIES: 'edit_community_join_policies',
  VIEW_COMMUNITY_ACTIVITY_LOG: 'view_community_activity_log',

  // GROUP scope
  CRUD_GROUP_OVERRIDE_SCHEME: 'crud_group_override_scheme',
  ADD_REMOVE_GROUP_MEMBER: 'add_remove_group_members',
  APPROVE_REJECT_GROUP_JOINING_REQUESTS: 'approve_reject_group_joining_requests',
  ASSIGN_UNASSIGN_ROLE_IN_GROUP: 'assign_unassign_role_in_group',
  VIEW_REPORTED_MEMBERS_IN_GROUP: 'view_reported_members_in_group',
  REPORT_MEMBER_IN_GROUP: 'report_member_in_group',
  EDIT_GROUP_INFO: 'edit_group_information',
  EDIT_GROUP_PRIVACY: 'edit_group_privacy',
  MANAGE_POST_SETTINGS: 'manage_post_settings',
  MANAGE_WEBHOOK_INTEGRATION: 'manage_webhook_integrations',
  VIEW_GROUP_ACTIVITY_LOG: 'view_group_activity_log',
  VIEW_POST_STATISTICS: 'view_post_statistics',
  CREATE_POST_ARTICLE: 'create_post_article',
  APPROVE_DENY_POST: 'approve_deny_post',
  REPORT_A_POST: 'report_a_post',
  VIEW_REPORTED_POSTS: 'view_reported_posts',
  CREATE_IMPORTANT_POST: 'create_important_post',
  EDIT_OWN_POST: 'edit_own_post',
  DELETE_OWN_POST: 'delete_own_post',
  DELETE_OTHERS_POST: 'delete_others_post',

  // CHAT scope
  SEND_MESSAGE: 'send_message',
  EDIT_OWN_MESSAGE: 'edit_own_message',
  DELETE_OWN_MESSAGE: 'delete_own_message',
  ADD_DELETE_REACTIONS: 'add_delete_reactions',
  CHANNEL_MENTIONS: 'channel_mentions',
  DELETE_OTHERS_MESSAGE: 'delete_others_message',
  CREATE_DM_AND_GM: 'create_dm_and_gm',
  VIEW_DM_MEMBERS: 'view_members',
  LEAVE_DM: 'leave_dm',
  ADD_REMOVE_GM_MEMBERS: 'add_remove_gm_members',
  ASSIGN_UNASSIGN_GM_ADMIN_ROLE: 'assign_unassign_gm_admin_role',
};

export const SUBJECT = {
  COMMUNITY: 'community',
  GROUP: 'group',
  USER: 'user',
  SCHEME: 'scheme',
};

export const CACHE_KEYS = {
  USER_PERMISSIONS: 'user_permissions',
};

export class BasicPermissionDto {
  public key: string;
  public name: string;
  public description: string;
}

export const BASIC_PERMISSIONS: {
  [k: string]: BasicPermissionDto;
} = {
  [PERMISSION_KEY.EDIT_OWN_POST]: {
    key: PERMISSION_KEY.EDIT_OWN_POST,
    name: PERMISSION_KEY.EDIT_OWN_POST,
    description: PERMISSION_KEY.EDIT_OWN_POST,
    fixedForRoles: ['CREATOR'],
  } as BasicPermissionDto,
};
