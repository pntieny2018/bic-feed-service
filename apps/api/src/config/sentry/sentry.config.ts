import { ISentryConfig } from './sentry-config.interface';

export const getSentryConfig = (): ISentryConfig => ({
  // enable and debug
  enable: process.env.SENTRY_ENABLE === 'true',
  debug: process.env.SENTRY_DEBUG === 'true',
  logLevel: ['debug', 'warn', 'error'],
  // integrations
  traceRequest: process.env.SENTRY_TRACE_REQUEST === 'true',
  traceORM: process.env.SENTRY_TRACE_ORM === 'true',
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) ?? 0.5,
  // endpoint sentry
  dsn: process.env.SENTRY_DSN,
  // info app
  environment: process.env.SENTRY_ENV,
  release: process.env.SENTRY_RELEASE,
  // close
  closeWhenTimeout: process.env.SENTRY_CLOSE_WHEN_TIMEOUT === 'true',
  timeout: parseInt(process.env.SENTRY_TIMEOUT) || 5000,
});
