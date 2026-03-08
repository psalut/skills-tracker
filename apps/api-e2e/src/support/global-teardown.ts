import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/* eslint-disable */

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const pidFile = path.join(REPO_ROOT, 'tmp-api-e2e.pid');

function killPid(pid: number): void {
  if (!Number.isFinite(pid) || pid <= 0) return;

  const isWin = process.platform === 'win32';

  if (isWin) {
    // /T = mata árbol, /F = force
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
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
}

module.exports = async function () {
  if (!existsSync(pidFile)) return;

  const raw = readFileSync(pidFile, 'utf-8').trim();
  const pid = Number(raw);

  killPid(pid);

  try {
    unlinkSync(pidFile);
  } catch {
    // ignore
  }
};
