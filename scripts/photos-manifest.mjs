/**
 * 生成 src/lib/photos.gen.ts —— 关于页照片墙的构建时清单。
 *
 * Worker 运行时无法读取 public/photos（文件在 ASSETS 绑定里），
 * 所以照片列表在构建/开发启动时生成，HomePage 直接 import。
 */
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const photosDir = path.join(root, 'public', 'photos');

/** 照片配文（按文件名，可选） */
const CAPTIONS = {
  '01-tianjin-coast.jpg': {
    zh: '天津滨海 · 我最喜欢的照片之一',
    en: 'Tianjin Binhai — one of my favorite shots',
  },
  '02-cc-cat.jpg': { zh: '微信头像 · CC 猫', en: 'WeChat avatar — CC the cat' },
  '03-painting-study.jpg': { zh: '绘画临摹练习', en: 'Painting study' },
  '04-sky-kid.jpg': { zh: '光遇 · 我的光崽', en: 'Sky: Children of the Light — my kid' },
  '05-my-cat.jpg': { zh: '偶遇的小猫', en: 'A cat I ran into' },
  '06-meme.jpg': { zh: '日常状态', en: 'Daily mood' },
  '07-choir.jpg': { zh: '学校合唱团', en: 'School choir' },
  '08-fav-meme.gif': { zh: '最爱用的表情包', en: 'My favorite meme' },
  '09-my-guitar.jpg': { zh: '我的吉他', en: 'My guitar' },
  '10-my-university.jpg': { zh: '我的大学', en: 'My university' },
  '11-my-partner.jpg': { zh: '我的对象（人先欠着）', en: 'My partner (I.O.U.)' },
  '12-high-school.jpg': { zh: '高中课堂上的一幕', en: 'A moment in high school class' },
};

let files = [];
try {
  files = readdirSync(photosDir)
    .filter((name) => /\.(avif|gif|jpe?g|png|webp)$/i.test(name) && !/-poster\.jpg$/i.test(name))
    .sort();
} catch {
  files = [];
}

const photos = files.map((file) => ({
  file,
  ...(CAPTIONS[file] ?? { zh: '', en: '' }),
}));

const code = `// 由 scripts/photos-manifest.mjs 生成，勿手改
export interface PhotoMeta {
  file: string;
  zh: string;
  en: string;
}
export const photos: PhotoMeta[] = ${JSON.stringify(photos, null, 2)};
`;

writeFileSync(path.join(root, 'src', 'lib', 'photos.gen.ts'), code, 'utf8');
console.log(`✔ photos manifest: ${photos.length} files → src/lib/photos.gen.ts`);
