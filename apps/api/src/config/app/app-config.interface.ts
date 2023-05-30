export interface IAppConfig {
  name: string;
  version: string;
  debug: boolean;
  url: string;
  port: number;
  env: string;
  apiPrefix: string;
  enableCors: boolean;
  corsOrigin: string[];
}
