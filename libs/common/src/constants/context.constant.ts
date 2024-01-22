export const HEADER_REQ_ID = 'x-request-id';
export const HEADER_VERSION_KEY = 'x-version-id';

export const ENV = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  DEVELOP: 'develop',
  INTERNAL: 'internal',
};

export const IS_LOCAL = !Object.values(ENV).includes(process.env.APP_ENV);
export const IS_ENABLE_LOG = process.env.APP_ENABLE_LOG === 'true';

export const CRON_RUN_SCHEDULED_CONTENT = '0,30 * * * *';
