export const HEADER_REQ_ID = 'x-request-id';

export const ENV = {
  PRODUCTION: 'production',
  STAGING: 'staging',
  DEVELOP: 'develop',
  INTERNAL: 'internal',
};

export const IS_LOCAL = !Object.values(ENV).includes(process.env.APP_ENV);
