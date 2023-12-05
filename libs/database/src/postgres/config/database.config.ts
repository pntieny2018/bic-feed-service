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

export const getDatabaseConfig = (): IDatabaseConfig => ({
  dialect: process.env.DB_CONNECTION as Dialect,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  schema: process.env.DB_SCHEMA,
  isDebug: process.env.DB_DEBUG === 'true',
  ssl: process.env.DB_SSL === 'true',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
