export const GROUP_ENDPOINT = {
  INTERNAL: {
    SHARED_GROUPS: '/internal/shared-groups?ids=:ids',
    USER_PERMISSIONS: '/internal/users/:userId/permissions',
    CHECK_CUD_TAG: '/internal/users/:userId/can-cud-tags/:rootGroupId',
    USER_ROLE_IN_GROUPS: '/internal/groups/users',
    NUMBER_USERS_IN_GROUPS: '/internal/groups/ids/user-count',
    USERS_IN_GROUPS: '/internal/users-in-groups',
  },
};
