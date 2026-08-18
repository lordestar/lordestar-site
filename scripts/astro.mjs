import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
process.env.ASTRO_TELEMETRY_DISABLED ??= 'true';
if (process.argv.includes('dev')) process.env.NODE_ENV ??= 'development';

const child = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', ...process.argv.slice(2)],
  {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code) => process.exit(code ?? 1));
