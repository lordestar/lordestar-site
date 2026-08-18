import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const node = process.execPath;

const copied = spawnSync(node, ['scripts/copy-admin.mjs', 'local'], {
  cwd: root,
  stdio: 'inherit',
});
if (copied.status !== 0) {
  process.exit(copied.status ?? 1);
}

const proxy = spawn(node, ['node_modules/decap-server/dist/index.js'], {
  cwd: root,
  stdio: 'inherit',
});
const dev = spawn(node, ['node_modules/astro/bin/astro.mjs', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: 'true' },
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  proxy.kill();
  dev.kill();
  process.exitCode = code;
}

proxy.on('exit', (code) => stop(code ?? 0));
dev.on('exit', (code) => stop(code ?? 0));
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
