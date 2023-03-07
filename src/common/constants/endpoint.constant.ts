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
    },
  },
  UPLOAD: {
    GET_FILES: '/files/ids',
    GET_VIDEOS: 'videos/ids',
  },
};
