export const ENDPOINT = {
  GROUP: {
    ME: {
      PERMISSION: '/me/permissions',
    },
    GROUP_ADMIN_PATH: '/groups/:groupId/users',
    INTERNAL: {
      COMMUNITY_ADMIN_PATH: '/internal/communities-admins',
      GROUPS_PATH: '/internal/shared-groups?ids=:ids',
    },
  },
  USER: {
    INTERNAL: {
      CHECK_CUD_TAG: '/internal/users/:userId/can-cud-tags/:rootGroupId',
      GET_USER: '/internal/shared-users/:username',
      USERS_PATH: '/internal/shared-users',
    },
  },
  UPLOAD: {
    INTERNAL: {
      GET_FILES: '/internal/files/ids',
      GET_VIDEOS: '/internal/videos/ids',
      UPDATE_IMAGES: '/internal/images',
      GET_IMAGES: '/internal/images/ids',
    },
  },
  NOTIFICATION: {
    INTERNAL: {
      SPECIFIC_NOTIFICATION_SETTINGS: '/internal/settings/specific/:userId/:targetId',
    },
  },
};
