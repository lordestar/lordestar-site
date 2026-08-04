import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve('node_modules/decap-cms/dist/decap-cms.js');
const dest = resolve('public/admin/decap-cms.js');

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log('decap-cms copied to public/admin/decap-cms.js');

