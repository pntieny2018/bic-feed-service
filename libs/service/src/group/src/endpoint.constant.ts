export const GROUP_ENDPOINT = {
  ME: {
    PERMISSION: '/me/permissions',
  },
  GROUP_ADMIN_PATH: '/groups/:groupId/members',
  INTERNAL: {
    COMMUNITY_ADMIN_PATH: '/internal/communities-admins',
    GROUPS_PATH: '/internal/shared-groups?ids=:ids',
  },
};
