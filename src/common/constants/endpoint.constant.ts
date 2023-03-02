export const ENDPOINT = {
  GROUP: {
    ME: {
      PERMISSION: '/me/permissions',
    },
    INTERNAL: {
      CHECK_CUD_TAG: '/internal/users/:userId/can-cud-tags/:rootGroupId',
      GET_USER: '/internal/shared-users/:username',
    },
  },
  UPLOAD: {
    GET_FILES: '/files/ids',
    GET_VIDEOS: 'videos/ids',
  },
};
