export const ACTIONS = {
  ACCOUNT: {
    FREE: {
      DISABLE_ACCOUNT: 'disable_account',
      DELETE_ACCOUNT: 'delete_account',
      VIEW_VIP_CERT: 'view_vip_cert',
      MANAGE_VIP_CERT: 'manage_vip_cert',
      VIEW_MSP: 'view_msp', // view membership subscription plan
      MANAGE_MSP: 'manage_msp', // manage membership subscription plan
      VIEW_CARD_SETTING: 'view_card_setting',
      MANAGE_CARD_SETTING: 'manage_card_setting',
      MAKE_DIRECT_PAYMENT: 'create_direct_payment',
      MAKE_RECURRING_PAYMENT: 'create_recurring_payment',
    },
    PAID: {
      DISABLE_ACCOUNT: 'disable_account',
      DELETE_ACCOUNT: 'delete_account',
      VIEW_VIP_CERT: 'view_vip_cert',
      MANAGE_VIP_CERT: 'manage_vip_cert',
      VIEW_MSP: 'view_msp', // view membership subscription plan
      MANAGE_MSP: 'manage_msp', // manage membership subscription plan
      VIEW_CARD_SETTING: 'view_card_setting',
      MANAGE_CARD_SETTING: 'manage_card_setting',
      MAKE_DIRECT_PAYMENT: 'create_direct_payment',
      MAKE_RECURRING_PAYMENT: 'create_recurring_payment',
      VIEW_USER: 'view_user',
      EDIT_MEMBERSHIP: 'edit_membership',
      VIEW_ROLE: 'view_role',
      CREATE_ROLE: 'create_role',
      EDIT_ROLE: 'edit_role',
      DELETE_ROLE: 'delete_role',
      VIEW_ROOT_GROUP: 'view_root_group',
      CREATE_ROOT_GROUP: 'create_root_group',
      EDIT_ROOT_GROUP: 'edit_root_group',
      DELETE_ROOT_GROUP: 'delete_root_group',
      DISABLE_POST: 'disable_post',
      DISABLE_CHAT: 'disable_chat',
      IMPERSONATE: 'impersonate',
      VIEW_GROUP_STRUCTURE: 'view_group_structure',
      CREATE_GROUP_STRUCTURE: 'create_group_structure',
      EDIT_GROUP_STRUCTURE: 'edit_group_structure',
      DELETE_GROUP_STRUCTURE: 'delete_group_structure',
      EDIT_GROUP_OF_USER: 'edit_group_of_user',
      EDIT_MEMBERSHIP_OF_USER: 'edit_membership_of_user',
    },
    SUB: {
      VIEW_USER: 'view_user',
      EDIT_GROUP_OF_USER: 'edit_group_of_user',
      EDIT_MEMBERSHIP_OF_USER: 'edit_membership_of_user',
      VIEW_ROLE: 'view_role',
      CREATE_ROLE: 'create_role',
      EDIT_ROLE: 'edit_role',
      DELETE_ROLE: 'delete_role',
      VIEW_GROUP_STRUCTURE: 'view_group_structure',
      CREATE_GROUP_STRUCTURE: 'create_group_structure',
      EDIT_GROUP_STRUCTURE: 'edit_group_structure',
      DELETE_GROUP_STRUCTURE: 'delete_group_structure',
      VIEW_MSP: 'view_msp', // view membership subscription plan
      MANAGE_MSP: 'manage_msp', // manage membership subscription plan
    },
  },
  COMMUNITY: {
    MANAGE_SCHEME: 'manage_community_scheme',
    CREATE: 'create_community',
    MANAGE_MEMBER: 'manage_community_member',
    MANAGE_JOINING_REQUEST: 'manage_community_joining_request',
    MANAGE_MEMBER_ROLE: 'manage_community_member_role', // Assign / Unassign role
    CREATE_INNER_GROUPS: 'create_inner_groups',
    DELETE_INNER_GROUPS: 'delete_inner_groups',
    TRANSFER: 'transfer_community',
    DELETE_PERMANENTLY: 'delete_community_permanently',
    MANAGE_ACTIVE_STATUS: 'manage_community_active_status', // Deactivate/Activate community temporarily
    VIEW_REPORTED_MEMBERS: 'view_reported_members',
    REPORT_MEMBER: 'report_community_member',
    EDIT_INFO: 'edit_info',
    EDIT_PRIVACY: 'edit_community_privacy',
    EDIT_JOIN_POLICIES: 'edit_jojn_policies',
    VIEW_ACTIVITY_LOG: 'view_activity_log',
  },
  GROUP: {
    VIEW_PROFILE: 'view_group_profile',
    VIEW_MEMBERS: 'view_group_members',
    SETTING: 'setting',
    VIEW_MESSAGE: 'view_message',
    VIEW_MESSAGE_HISTORY: 'view_message_history',
    CREATE_CHAT_GROUP: 'create_chat_group',
    SEND_MESSAGE: 'send_message',
    SEND_FILES: 'send_files',
    SEND_IMAGES: 'send_images',
    REACT: 'react',
    SEND_TICKERS: 'send_tickers',
    MENTION_ALL_HERE: 'mention_all_here',
    PIN_MESSAGE: 'pin_message',
    DELETE_MESSAGE: 'delete_message',
    VIEW_POST: 'view_post',
    VIEW_RELATED_POST: 'view_related_post',
    MARK_IMPORTANT_POST: 'mark_important_post',
    DELETE_POST: 'delete_post',

    MANAGE_SCHEME: 'manage_group_scheme',
    MANAGE_MEMBER: 'manage_group_member',
    MANAGE_JOINING_REQUEST: 'manage_group_joining_request',
    MANAGE_MEMBER_ROLE: 'manage_group_member_role',
    VIEW_REPORTED_MEMBERS: 'view_reported_members',
    REPORT_MEMBER: 'report_group_member',
    EDIT_GROUP_PROFILE: 'edit_group_profile',
    EDIT_PRIVACY: 'edit_group_privacy',
    MANAGE_POST_SETTINGS: 'manage_post_settings',
    MANAGE_INTEGRATION: 'manage_integration', // Manage webhook/integrations
    VIEW_ACTIVITY_LOG: 'view_activity_log',
    VIEW_POST_STATISTIC: 'view_post_statistic',
    CREATE_POST_ARTICLE: 'create_post_article',
    APPROVE_POST: 'approve_post',
    DENY_POST: 'deny_post',
    REPORT_POST: 'report_post',
    VIEW_REPORTED_POSTS: 'view_reported_posts',
    CREATE_IMPORTANT_POST: 'create_important_post',
    EDIT_OWN_POST: 'edit_own_post',
    DELETE_OWN_POST: 'delete_own_post',
    DELETE_OTHERS_POST: 'delete_others_post',
  },
  USER: {
    EDIT_OWN_PROFILE: 'edit_own_profile',
    EDIT_OTHER_USER_PROFILE: 'edit_other_user_profile',
    VIEW_OTHER_USER_PROFILE: 'view_other_user_profile',
  },
  STAFF: {
    COMMUNITY: {
      MANAGE: 'manage',
    },
    GROUP: {
      MANAGE: 'manage',
    },
    USER: {
      MANAGE: 'manage',
    },
    SCHEME: {
      MANAGE: 'manage',
    },
  },
};

export const NO_SUBJECT_ACTIONS = [
  ACTIONS.ACCOUNT.PAID.CREATE_GROUP_STRUCTURE,
  ACTIONS.USER.EDIT_OWN_PROFILE,
  ACTIONS.USER.EDIT_OTHER_USER_PROFILE,
  ACTIONS.USER.VIEW_OTHER_USER_PROFILE,
];

export const SUBJECT = {
  COMMUNITY: 'community',
  GROUP: 'group',
  USER: 'user',
  SCHEME: 'scheme',
};

export const CACHE_KEYS = {
  USER_PERMISSIONS: 'user_permissions',
};

export enum BeinStaffRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STAFF = 'STAFF',
}
