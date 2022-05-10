import { Dialect } from 'sequelize';
import { PoolOptions } from 'sequelize/types/sequelize';

export interface IDatabaseConfig {
  dialect: Dialect;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  schema?: string;
  uri?: string;
  isDebug?: boolean;
  ssl: boolean;
  pool?: PoolOptions;
}
