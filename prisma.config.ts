import { defineConfig, env } from 'prisma/config';
import {
  loadWorkspaceEnv,
  resolveWorkspaceEnvironment,
} from './tools/env/workspace-env';

loadWorkspaceEnv({
  environment: resolveWorkspaceEnvironment(process.env.NODE_ENV),
});

export default defineConfig({
  schema: 'apps/api/prisma/schema.prisma',
  migrations: {
    path: 'apps/api/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
