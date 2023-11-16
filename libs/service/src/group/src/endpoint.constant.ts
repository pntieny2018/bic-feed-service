export const GROUP_ENDPOINT = {
  GROUP_MEMBERS: '/groups/:groupId/members',
  INTERNAL: {
    COMMUNITY_ADMINS: '/internal/communities-admins',
    SHARED_GROUPS: '/internal/shared-groups?ids=:ids',
    USER_PERMISSIONS: '/internal/users/:userId/permissions',
    CHECK_CUD_TAG: '/internal/users/:userId/can-cud-tags/:rootGroupId',
    USER_ROLE_IN_GROUPS: '/internal/groups/users',
    USERS_IN_GROUPS: '/internal/groups/ids/users',
  },
};
