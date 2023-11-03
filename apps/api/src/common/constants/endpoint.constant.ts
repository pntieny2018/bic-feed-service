export const ENDPOINT = {
  NOTIFICATION: {
    INTERNAL: {
      SPECIFIC_NOTIFICATION_SETTINGS: '/internal/settings/specific/:userId/:targetId',
    },
  },
};

export const AUTH_MIDDLEWARE_WHITELIST_PATTERNS = [
  '/app/health-check',
  '/health(.*)',
  '/follows(.*)',
];
