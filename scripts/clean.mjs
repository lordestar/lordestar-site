import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

for (const target of ['dist', '.astro']) {
  rmSync(`${root}${target}`, { recursive: true, force: true });
}

console.log('cleaned: dist, .astro');
