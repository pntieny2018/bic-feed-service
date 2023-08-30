export const GROUP_ENDPOINT = {
  ME: {
    PERMISSION: '/me/permissions',
  },
  GROUP_MEMBERS: '/groups/:groupId/members',
  INTERNAL: {
    COMMUNITY_ADMINS: '/internal/communities-admins',
    SHARED_GROUPS: '/internal/shared-groups?ids=:ids',
  },
};
