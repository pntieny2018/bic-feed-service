export const GROUP_ENDPOINT = {
  ME: {
    PERMISSION: '/me/permissions',
  },
  GROUP_MEMBERS: '/groups/:groupId/members',
  INTERNAL: {
    COMMUNITY_ADMINS: '/internal/communities-admins',
    SHARED_GROUPS: '/internal/shared-groups?ids=:ids',
    USER_PERMISSIONS: '/internal/users/:userId/permissions',
    USER_ROLE_IN_GROUPS: '/internal/groups/users',
  },
};
