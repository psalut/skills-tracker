import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { waitForPortOpen } from '@nx/node/utils';
import { resetDatabase } from './reset-database';
import {
  getE2EApiHost,
  getE2EApiPort,
  loadWorkspaceEnv,
} from '../../../../tools/env/workspace-env';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const PID_FILE = path.join(REPO_ROOT, 'tmp-api-e2e.pid');

function loadTestEnv(): void {
  loadWorkspaceEnv({ environment: 'test', override: true });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing after loading .env.test');
  }
}

function assertTestDatabaseUrl(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is missing');

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  const expectedHost = process.env.NEON_TEST_HOST_HINT;
  if (!expectedHost) {
    throw new Error(
      'NEON_TEST_HOST_HINT is missing in .env.test (refusing to run e2e without a strong guard).',
    );
  }

  if (parsed.host !== expectedHost) {
    throw new Error(
      `Refusing to run e2e: DATABASE_URL host mismatch.\nExpected: ${expectedHost}\nActual:   ${parsed.host}`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    const finalize = (result: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));
    socket.connect(port, host);
  });
}

async function assertPortAvailable(host: string, port: number): Promise<void> {
  if (await isPortOpen(host, port)) {
    throw new Error(
      `Refusing to run api-e2e: ${host}:${port} is already in use before startup.`,
    );
  }
}

function killPreviousE2EProcess(): void {
  if (!existsSync(PID_FILE)) return;

  const raw = readFileSync(PID_FILE, 'utf-8').trim();
  const pid = Number(raw);

  if (!Number.isFinite(pid) || pid <= 0) {
    try {
      unlinkSync(PID_FILE);
    } catch {
      // ignore
    }
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('cmd.exe', ['/c', 'taskkill', '/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  } else {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // ignore
    }
  }

  try {
    unlinkSync(PID_FILE);
  } catch {
    // ignore
  }
}

function runMigrationsOnce(): void {
  const isWin = process.platform === 'win32';

  const result = isWin
    ? spawnSync(
        'cmd.exe',
        [
          '/c',
          'pnpm',
          'prisma',
          'migrate',
          'deploy',
          '--schema',
          'apps/api/prisma/schema.prisma',
        ],
        {
          cwd: REPO_ROOT,
          encoding: 'utf-8',
          windowsHide: true,
          env: {
            ...process.env,
            DATABASE_URL:
              process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL,
          },
        },
      )
    : spawnSync(
        'pnpm',
        [
          'prisma',
          'migrate',
          'deploy',
          '--schema',
          'apps/api/prisma/schema.prisma',
        ],
        {
          cwd: REPO_ROOT,
          encoding: 'utf-8',
          env: {
            ...process.env,
            DATABASE_URL:
              process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL,
          },
        },
      );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    throw new Error('Prisma migrate deploy failed');
  }
}

async function runMigrationsWithRetry(): Promise<void> {
  const attempts = 3;

  for (let i = 1; i <= attempts; i++) {
    try {
      runMigrationsOnce();
      return;
    } catch (error) {
      if (i === attempts) throw error;
      await sleep(1000 * i);
    }
  }
}

async function waitForApiStartup(
  child: ChildProcess,
  host: string,
  port: number,
): Promise<void> {
  const childFailed = new Promise<never>((_, reject) => {
    child.once('error', (error) => {
      reject(
        new Error(
          `API process failed before startup completed: ${error.message}`,
        ),
      );
    });

    child.once('exit', (code, signal) => {
      reject(
        new Error(
          `API process exited before startup completed (code: ${code ?? 'null'}, signal: ${signal ?? 'none'}).`,
        ),
      );
    });
  });

  await Promise.race([
    waitForPortOpen(port, { host, retries: 120, retryDelay: 250 }),
    childFailed,
  ]);

  if (child.exitCode !== null) {
    throw new Error(
      `API process is not running after startup completed (exit code: ${child.exitCode}).`,
    );
  }
}

module.exports = async function () {
  loadTestEnv();
  assertTestDatabaseUrl();
  killPreviousE2EProcess();

  const host = getE2EApiHost();
  const port = getE2EApiPort();

  await runMigrationsWithRetry();
  await resetDatabase();

  await assertPortAvailable(host, port);

  const isWin = process.platform === 'win32';

  const child = isWin
    ? spawn('cmd.exe', ['/c', 'node', 'dist/api/main.js'], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DATABASE_URL: process.env.DATABASE_URL,
          HOST: host,
          PORT: String(port),
        },
        windowsHide: true,
      })
    : spawn('node', ['dist/api/main.js'], {
        cwd: REPO_ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DATABASE_URL: process.env.DATABASE_URL,
          HOST: host,
          PORT: String(port),
        },
      });

  if (!child.pid) {
    throw new Error('API process started but PID is undefined');
  }

  writeFileSync(PID_FILE, String(child.pid), { encoding: 'utf-8' });

  await waitForApiStartup(child, host, port);

  globalThis.__TEARDOWN_MESSAGE__ = '\nTearing down...\n';
};
