import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

const environment = process.env.NODE_ENV ?? 'development';

const envFile =
  environment === 'test'
    ? path.resolve(process.cwd(), '.env.test')
    : environment === 'production'
      ? path.resolve(process.cwd(), '.env.prod')
      : path.resolve(process.cwd(), '.env');

dotenv.config({ path: envFile });

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  migrations: {
    path: 'apps/api/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});