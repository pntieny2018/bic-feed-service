export const ENDPOINT = {
  GROUP: {
    ME: {
      PERMISSION: '/me/permissions',
    },
    GROUP_ADMIN_PATH: '/groups/:groupId/users',
    INTERNAL: {
      CHECK_CUD_TAG: '/internal/users/:userId/can-cud-tags/:rootGroupId',
      GET_USER: '/internal/shared-users/:username',
      COMMUNITY_ADMIN_PATH: '/internal/communities-admins',
      USERS_PATH: '/internal/shared-users?ids=:ids',
      GROUPS_PATH: '/internal/shared-groups?ids=:ids',
    },
  },
  UPLOAD: {
    INTERNAL: {
      GET_FILES: '/files/ids',
      GET_VIDEOS: '/videos/ids',
      UPDATE_IMAGES: '/images/ids',
      GET_IMAGES: '/images/ids',
    },
  },
};
