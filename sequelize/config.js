// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  dialect: process.env.DB_CONNECTION,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  searchPath: process.env.DB_SCHEMA,
  define: {
    schema: process.env.DB_SCHEMA,
    underscored: true,
    timestamps: true,
  },
  dialectOptions: {
    prependSearchPath: true,
  },
  ssl: process.env.DB_SSL === 'true',
  native: process.env.DB_SSL === 'true',
  operatorsAliases: null,
};
