import { existsSync } from 'fs';
import { config } from 'dotenv';
import { join } from 'path';

const pathEnv = join(__dirname, '.env');
if (existsSync(pathEnv)) {
  config({
    path: pathEnv,
  });
} else {
  config({
    path: process.env.DOTENV_CONFIG_PATH,
  });
}
