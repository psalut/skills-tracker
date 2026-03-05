import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';

// Cargar env explícitamente (evita el log "injecting env (0)")
const envFile =
  process.env.NODE_ENV === 'test'
    ? path.resolve(process.cwd(), '.env.test')
    : path.resolve(process.cwd(), '.env');

// dotenv NO pisa variables existentes por defecto
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
