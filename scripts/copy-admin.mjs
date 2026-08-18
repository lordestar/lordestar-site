import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const mode = process.argv[2] === 'local' ? 'local' : 'prod';

const source = resolve(root, 'node_modules/decap-cms/dist/decap-cms.js');
const dest = resolve(root, 'public/admin/decap-cms.js');
const configSource = resolve(root, `public/admin/config.${mode}.yml`);
const configDest = resolve(root, 'public/admin/config.yml');

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
copyFileSync(configSource, configDest);
console.log('decap-cms copied to public/admin/decap-cms.js');
console.log(`admin config (${mode}) copied to public/admin/config.yml`);
