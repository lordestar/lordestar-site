/**
 * 内容迁移脚本：把 src/content/{works,posts}/{zh,en}/*.md 导出为 D1 导入 SQL。
 *
 * 用法：
 *   node scripts/migrate-content.mjs
 *   # 生成 scripts/seed-data.sql，然后：
 *   npx wrangler d1 execute lordestar-db --remote --file=scripts/seed-data.sql
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(root, 'scripts', 'seed-data.sql');

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function toIsoDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().slice(0, 10);
}

function toJsonArray(value) {
  try {
    return JSON.stringify(Array.isArray(value) ? value : []);
  } catch {
    return '[]';
  }
}

const rows = [];

function walkCollection(dir, collection) {
  for (const locale of ['zh', 'en']) {
    const localeDir = path.join(dir, locale);
    if (!existsSync(localeDir)) continue;
    for (const file of readdirSync(localeDir)) {
      if (!/\.md$/.test(file)) continue;
      const full = path.join(localeDir, file);
      const { data, content } = matter(readFileSync(full, 'utf8'));
      rows.push({
        collection,
        locale,
        slug: file.replace(/\.md$/, ''),
        data,
        body: content.trim(),
      });
    }
  }
}

walkCollection(path.join(root, 'src', 'content', 'works'), 'works');
walkCollection(path.join(root, 'src', 'content', 'posts'), 'posts');

const lines = ['-- 由 scripts/migrate-content.mjs 生成，勿手改', ''];

for (const row of rows) {
  const { collection, locale, slug, data, body } = row;

  if (collection === 'works') {
    lines.push(
      `INSERT OR REPLACE INTO works (locale, slug, title, type, date, summary, tags, link, audio, cover, featured, body) VALUES (` +
        `'${sqlEscape(locale)}', ` +
        `'${sqlEscape(slug)}', ` +
        `'${sqlEscape(data.title ?? '')}', ` +
        `'${sqlEscape(data.type ?? 'music')}', ` +
        `'${sqlEscape(toIsoDate(data.date))}', ` +
        `'${sqlEscape(data.summary ?? '')}', ` +
        `'${sqlEscape(toJsonArray(data.tags))}', ` +
        `${data.link ? `'${sqlEscape(data.link)}'` : 'NULL'}, ` +
        `${data.audio ? `'${sqlEscape(data.audio)}'` : 'NULL'}, ` +
        `${data.cover ? `'${sqlEscape(data.cover)}'` : 'NULL'}, ` +
        `${data.featured ? 1 : 0}, ` +
        `'${sqlEscape(body)}');`,
    );
  } else {
    lines.push(
      `INSERT OR REPLACE INTO posts (locale, slug, title, date, summary, tags, images, body) VALUES (` +
        `'${sqlEscape(locale)}', ` +
        `'${sqlEscape(slug)}', ` +
        `'${sqlEscape(data.title ?? '')}', ` +
        `'${sqlEscape(toIsoDate(data.date))}', ` +
        `'${sqlEscape(data.summary ?? '')}', ` +
        `'${sqlEscape(toJsonArray(data.tags))}', ` +
        `'[]', ` +
        `'${sqlEscape(body)}');`,
    );
  }
}

writeFileSync(OUT, lines.join('\n') + '\n', 'utf8');

const worksCount = rows.filter((r) => r.collection === 'works').length;
const postsCount = rows.filter((r) => r.collection === 'posts').length;

console.log(`✔ 已生成 ${OUT}`);
console.log(`  works: ${worksCount} 条，posts: ${postsCount} 条`);
console.log('');
console.log('下一步（需要已登录 Cloudflare）：');
console.log('  npx wrangler d1 execute lordestar-db --remote --file=scripts/seed-data.sql');
