import { writeFileSync } from 'node:fs';
import path from 'node:path';

const apiBaseUrl = process.env.WEB_API_BASE_URL?.trim();
const isProductionBuild =
  process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

if (isProductionBuild && !apiBaseUrl) {
  throw new Error(
    'Missing WEB_API_BASE_URL. Set it in Vercel to the public base URL of the API.',
  );
}

const runtimeConfigPath = path.resolve(
  process.cwd(),
  'apps/web/public/runtime-config.js',
);

const serializedApiBaseUrl = apiBaseUrl
  ? JSON.stringify(apiBaseUrl)
  : 'undefined';

writeFileSync(
  runtimeConfigPath,
  [
    'window.__SKILLS_TRACKER_CONFIG__ = {',
    `  ...(window.__SKILLS_TRACKER_CONFIG__ ?? {}),`,
    `  ...(typeof ${serializedApiBaseUrl} === 'string' ? { apiBaseUrl: ${serializedApiBaseUrl} } : {}),`,
    '};',
    '',
  ].join('\n'),
);
