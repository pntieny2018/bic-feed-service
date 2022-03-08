import { LogLevel } from '@nestjs/common';

export interface ISentryConfig {
  enable: boolean;
  dsn: string;
  environment: string;
  debug: boolean;
  logLevel: LogLevel[];
  release: string;
  traceRequest: boolean;
  traceORM: boolean;
  tracesSampleRate: number;
  closeWhenTimeout: boolean;
  timeout: number;
}
