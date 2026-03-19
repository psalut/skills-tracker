import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import path from 'node:path';

export type WorkspaceEnvironment = 'development' | 'test' | 'production';

type LoadWorkspaceEnvOptions = {
  environment?: WorkspaceEnvironment;
  override?: boolean;
};

export function resolveWorkspaceEnvironment(
  nodeEnv = process.env.NODE_ENV,
): WorkspaceEnvironment {
  if (nodeEnv === 'test' || nodeEnv === 'production') {
    return nodeEnv;
  }

  return 'development';
}

export function resolveEnvFile(
  environment = resolveWorkspaceEnvironment(),
): string {
  const filename =
    environment === 'test'
      ? '.env.test'
      : environment === 'production'
        ? '.env.prod'
        : '.env';

  return path.resolve(process.cwd(), filename);
}

export function loadWorkspaceEnv(
  options: LoadWorkspaceEnvOptions = {},
): string | undefined {
  const environment =
    options.environment ?? resolveWorkspaceEnvironment(process.env.NODE_ENV);
  const envFile = resolveEnvFile(environment);

  if (!existsSync(envFile)) {
    if (environment === 'production') {
      return undefined;
    }

    throw new Error(`Missing environment file: ${envFile}`);
  }

  dotenv.config({
    path: envFile,
    override: options.override ?? false,
    quiet: true,
  });

  return envFile;
}

export function getEnv(
  names: string | string[],
  fallback?: string,
): string | undefined {
  const candidates = Array.isArray(names) ? names : [names];

  for (const name of candidates) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return fallback;
}

export function getRequiredEnv(names: string | string[]): string {
  const value = getEnv(names);

  if (!value) {
    const label = Array.isArray(names) ? names.join(', ') : names;
    throw new Error(`Missing required environment variable: ${label}`);
  }

  return value;
}

export function getNumberEnv(
  names: string | string[],
  fallback: number,
): number {
  const rawValue = getEnv(names);

  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    const label = Array.isArray(names) ? names.join(', ') : names;
    throw new Error(`Invalid numeric environment variable: ${label}`);
  }

  return parsed;
}

export function getApiHost(): string | undefined {
  return getEnv(['API_HOST', 'HOST'])!;
}

export function getApiPort(): number {
  return getNumberEnv(['API_PORT', 'PORT'], 3000);
}

export function getE2EApiHost(): string {
  return getEnv(['E2E_API_HOST', 'HOST'], '127.0.0.1')!;
}

export function getE2EApiPort(): number {
  return getNumberEnv(['E2E_API_PORT', 'PORT'], 3333);
}

export function getWebPort(): number {
  return getNumberEnv('WEB_PORT', 4200);
}

export function getWebOrigins(): string[] {
  const configuredOrigins = getEnv(['WEB_ORIGIN', 'FRONTEND_ORIGIN']);

  if (configuredOrigins) {
    return configuredOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  const port = getWebPort();

  return [`http://localhost:${port}`, `http://127.0.0.1:${port}`];
}

export function getE2EBaseUrl(): string {
  return (
    getEnv('E2E_BASE_URL') ?? `http://${getE2EApiHost()}:${getE2EApiPort()}`
  );
}

export function getApiProxyTarget(): string {
  return getEnv('API_PROXY_TARGET') ?? `http://${getApiHost()}:${getApiPort()}`;
}
