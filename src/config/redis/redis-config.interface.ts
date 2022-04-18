export interface IRedisConfig {
  db: number;
  host: string;
  port: number;
  password: string;
  ssl: boolean;
  prefix: string;
}
