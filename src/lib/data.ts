import { getCollection } from 'astro:content';
import { marked } from 'marked';
import type { Locale } from '../i18n';
import { entriesFor, slugFromId } from '../i18n';

/**
 * 数据访问层。
 *
 * 两个后端：
 * - 生产（Cloudflare Pages + D1）：通过 `cloudflare:workers` 的 env.DB 查询；
 * - 本地开发：没有 D1 绑定（或绑定不可用）时回退到 Astro 内容集合
 *   （src/content/**\/*.md），保证 `pnpm dev` 零配置可跑。
 *
 * 返回形状与 CollectionEntry 兼容（id/data/body），组件无需大改。
 */

export interface WorkItem {
  id: string; // 'zh/xxx' | 'en/xxx'
  dbId?: number; // D1 数字主键（仅 D1 后端有，后台编辑用）
  data: {
    title: string;
    type: 'music' | 'code';
    date: Date;
    summary: string;
    tags: string[];
    link?: string;
    audio?: string;
    cover?: string;
    featured: boolean;
  };
  body: string; // Markdown 正文
}

export interface PostItem {
  id: string;
  dbId?: number;
  data: {
    title: string;
    date: Date;
    summary: string;
    tags: string[];
    images: string[]; // R2 key 列表（预留，照片型想法）
  };
  body: string;
}

// ── 运行时环境探测 ─────────────────────────────────────────────────────────

let cfEnv: { DB?: D1Database } | null | undefined;

async function getCfEnv(): Promise<{ DB?: D1Database } | null> {
  if (cfEnv !== undefined) return cfEnv;
  try {
    const mod = await import('cloudflare:workers');
    cfEnv = mod.env ?? null;
  } catch {
    cfEnv = null;
  }
  return cfEnv;
}

/**
 * D1 可用性探测（每个进程只做一次并缓存）。
 *
 * 开发模式下 adapter 也会注入一个本地 D1 绑定，但数据库可能还没有建表
 * （尚未执行 migrations）。此时不能直接查询，应回退到内容集合。
 */
let d1Ready: boolean | null = null;

async function d1Works(db: D1Database): Promise<boolean> {
  if (d1Ready !== null) return d1Ready;
  try {
    await db.prepare('SELECT count(*) AS n FROM works').first();
    d1Ready = true;
  } catch {
    d1Ready = false;
  }
  return d1Ready;
}

async function resolveBackend(): Promise<{ kind: 'd1'; db: D1Database } | { kind: 'content' }> {
  const env = await getCfEnv();
  if (env?.DB && (await d1Works(env.DB))) return { kind: 'd1', db: env.DB };
  return { kind: 'content' };
}

// ── D1 后端 ────────────────────────────────────────────────────────────────

interface WorkRow {
  id: number;
  locale: string;
  slug: string;
  title: string;
  type: string;
  date: string;
  summary: string;
  tags: string;
  link: string | null;
  audio: string | null;
  cover: string | null;
  featured: number;
  body: string;
}

interface PostRow {
  id: number;
  locale: string;
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string;
  images: string;
  body: string;
}

function rowToWork(row: WorkRow): WorkItem {
  return {
    id: `${row.locale}/${row.slug}`,
    dbId: row.id,
    data: {
      title: row.title,
      type: row.type === 'code' ? 'code' : 'music',
      date: new Date(row.date),
      summary: row.summary,
      tags: parseJsonArray(row.tags),
      link: row.link ?? undefined,
      audio: row.audio ?? undefined,
      cover: row.cover ?? undefined,
      featured: row.featured === 1,
    },
    body: row.body,
  };
}

function rowToPost(row: PostRow): PostItem {
  return {
    id: `${row.locale}/${row.slug}`,
    dbId: row.id,
    data: {
      title: row.title,
      date: new Date(row.date),
      summary: row.summary,
      tags: parseJsonArray(row.tags),
      images: parseJsonArray(row.images),
    },
    body: row.body,
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function worksFromD1(db: D1Database, locale: Locale): Promise<WorkItem[]> {
  const { results } = await db
    .prepare(
      `SELECT id, locale, slug, title, type, date, summary, tags, link, audio, cover, featured, body
       FROM works
       WHERE locale = ? AND title != ''
       ORDER BY date DESC`,
    )
    .bind(locale)
    .all<WorkRow>();
  return results.map(rowToWork);
}

async function postsFromD1(db: D1Database, locale: Locale): Promise<PostItem[]> {
  const { results } = await db
    .prepare(
      `SELECT id, locale, slug, title, date, summary, tags, images, body
       FROM posts
       WHERE locale = ? AND title != ''
       ORDER BY date DESC`,
    )
    .bind(locale)
    .all<PostRow>();
  return results.map(rowToPost);
}

// ── 内容集合兜底（本地开发 / 无 D1 绑定） ──────────────────────────────────

async function worksFromContent(locale: Locale): Promise<WorkItem[]> {
  const all = await getCollection('works');
  return entriesFor(all, locale)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((entry) => ({
      id: entry.id,
      data: {
        title: entry.data.title,
        type: entry.data.type,
        date: entry.data.date,
        summary: entry.data.summary,
        tags: entry.data.tags,
        link: entry.data.link,
        audio: entry.data.audio,
        cover: entry.data.cover,
        featured: entry.data.featured,
      },
      body: entry.body ?? '',
    }));
}

async function postsFromContent(locale: Locale): Promise<PostItem[]> {
  const all = await getCollection('posts');
  return entriesFor(all, locale)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((entry) => ({
      id: entry.id,
      data: {
        title: entry.data.title,
        date: entry.data.date,
        summary: entry.data.summary,
        tags: entry.data.tags,
        images: [],
      },
      body: entry.body ?? '',
    }));
}

// ── 对外 API ───────────────────────────────────────────────────────────────

/** 某语言的全部作品（按日期倒序，排除空标题）。 */
export async function getWorks(locale: Locale): Promise<WorkItem[]> {
  const backend = await resolveBackend();
  if (backend.kind === 'd1') return worksFromD1(backend.db, locale);
  return worksFromContent(locale);
}

/** 某语言的全部随想（按日期倒序，排除空标题）。 */
export async function getPosts(locale: Locale): Promise<PostItem[]> {
  const backend = await resolveBackend();
  if (backend.kind === 'd1') return postsFromD1(backend.db, locale);
  return postsFromContent(locale);
}

/** 按 slug 取单个作品（slug 不含语言前缀）。 */
export async function getWorkBySlug(locale: Locale, slug: string): Promise<WorkItem | undefined> {
  const works = await getWorks(locale);
  return works.find((work) => slugFromId(work.id) === slug);
}

/** 按 slug 取单个随想（slug 不含语言前缀）。 */
export async function getPostBySlug(locale: Locale, slug: string): Promise<PostItem | undefined> {
  const posts = await getPosts(locale);
  return posts.find((post) => slugFromId(post.id) === slug);
}

/** 精选作品（featured），按日期倒序，最多 limit 条。 */
export async function getFeaturedWorks(locale: Locale, limit = 4): Promise<WorkItem[]> {
  const works = await getWorks(locale);
  return works.filter((work) => work.data.featured).slice(0, limit);
}

/** Markdown 正文 → HTML。 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown) as string;
}

// ── 后台管理：写操作（仅 D1 后端） ─────────────────────────────────────────

export interface WorkInput {
  locale: Locale;
  slug: string;
  title: string;
  type: 'music' | 'code';
  date: string; // ISO 日期
  summary: string;
  tags: string[];
  link?: string;
  audio?: string;
  cover?: string;
  featured: boolean;
  body: string;
}

export interface PostInput {
  locale: Locale;
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  body: string;
}

/** 获取 D1 绑定；不可用时抛错（后台需要数据库）。 */
export async function requireDb(): Promise<D1Database> {
  const env = await getCfEnv();
  if (env?.DB && (await d1Works(env.DB))) return env.DB;
  throw new Error(
    '数据库不可用：本地开发请先执行 wrangler d1 migrations apply lordestar-db --local',
  );
}

/** 后台列表：全部语言。 */
export async function listAllWorks(db: D1Database): Promise<WorkItem[]> {
  const { results } = await db
    .prepare(
      `SELECT id, locale, slug, title, type, date, summary, tags, link, audio, cover, featured, body
       FROM works ORDER BY date DESC, id DESC`,
    )
    .all<WorkRow>();
  return results.map(rowToWork);
}

export async function listAllPosts(db: D1Database): Promise<PostItem[]> {
  const { results } = await db
    .prepare(
      `SELECT id, locale, slug, title, date, summary, tags, images, body
       FROM posts ORDER BY date DESC, id DESC`,
    )
    .all<PostRow>();
  return results.map(rowToPost);
}

export async function getWorkByDbId(db: D1Database, id: number): Promise<WorkItem | undefined> {
  const row = await db
    .prepare(
      `SELECT id, locale, slug, title, type, date, summary, tags, link, audio, cover, featured, body
       FROM works WHERE id = ?`,
    )
    .bind(id)
    .first<WorkRow>();
  return row ? rowToWork(row) : undefined;
}

export async function getPostByDbId(db: D1Database, id: number): Promise<PostItem | undefined> {
  const row = await db
    .prepare(
      `SELECT id, locale, slug, title, date, summary, tags, images, body
       FROM posts WHERE id = ?`,
    )
    .bind(id)
    .first<PostRow>();
  return row ? rowToPost(row) : undefined;
}

export async function createWork(db: D1Database, input: WorkInput): Promise<void> {
  await db
    .prepare(
      `INSERT INTO works (locale, slug, title, type, date, summary, tags, link, audio, cover, featured, body)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.locale,
      input.slug,
      input.title,
      input.type,
      input.date,
      input.summary,
      JSON.stringify(input.tags),
      input.link || null,
      input.audio || null,
      input.cover || null,
      input.featured ? 1 : 0,
      input.body,
    )
    .run();
}

export async function updateWork(db: D1Database, id: number, input: WorkInput): Promise<void> {
  await db
    .prepare(
      `UPDATE works SET locale = ?, slug = ?, title = ?, type = ?, date = ?, summary = ?,
       tags = ?, link = ?, audio = ?, cover = ?, featured = ?, body = ? WHERE id = ?`,
    )
    .bind(
      input.locale,
      input.slug,
      input.title,
      input.type,
      input.date,
      input.summary,
      JSON.stringify(input.tags),
      input.link || null,
      input.audio || null,
      input.cover || null,
      input.featured ? 1 : 0,
      input.body,
      id,
    )
    .run();
}

export async function deleteWork(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM works WHERE id = ?').bind(id).run();
}

export async function createPost(db: D1Database, input: PostInput): Promise<void> {
  await db
    .prepare(
      `INSERT INTO posts (locale, slug, title, date, summary, tags, images, body)
       VALUES (?, ?, ?, ?, ?, ?, '[]', ?)`,
    )
    .bind(
      input.locale,
      input.slug,
      input.title,
      input.date,
      input.summary,
      JSON.stringify(input.tags),
      input.body,
    )
    .run();
}

export async function updatePost(db: D1Database, id: number, input: PostInput): Promise<void> {
  await db
    .prepare(
      `UPDATE posts SET locale = ?, slug = ?, title = ?, date = ?, summary = ?, tags = ?, body = ?
       WHERE id = ?`,
    )
    .bind(
      input.locale,
      input.slug,
      input.title,
      input.date,
      input.summary,
      JSON.stringify(input.tags),
      input.body,
      id,
    )
    .run();
}

export async function deletePost(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
}

// ── 听歌日记 / 记录（diary） ───────────────────────────────────────────────

export interface DiaryItem {
  dbId: number;
  kind: 'song' | 'text' | 'photo';
  title: string;
  artist: string;
  album: string;
  cover: string;
  ncmId: number | null;
  songUrl: string;
  note: string;
  images: string[];
  public: boolean;
  createdAt: Date;
}

export interface DiaryInput {
  kind: 'song' | 'text' | 'photo';
  title: string;
  artist?: string;
  album?: string;
  cover?: string;
  ncmId?: number | null;
  songUrl?: string;
  note?: string;
  images?: string[];
  public?: boolean;
}

interface DiaryRow {
  id: number;
  kind: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  ncm_id: number | null;
  song_url: string;
  note: string;
  images: string;
  public: number;
  created_at: string;
}

function rowToDiary(row: DiaryRow): DiaryItem {
  return {
    dbId: row.id,
    kind: (['song', 'text', 'photo'] as const).includes(row.kind as 'song')
      ? (row.kind as DiaryItem['kind'])
      : 'song',
    title: row.title,
    artist: row.artist,
    album: row.album,
    cover: row.cover,
    ncmId: row.ncm_id,
    songUrl: row.song_url,
    note: row.note,
    images: parseJsonArray(row.images),
    public: row.public === 1,
    createdAt: new Date(row.created_at.replace(' ', 'T') + 'Z'),
  };
}

const DIARY_SELECT = `SELECT id, kind, title, artist, album, cover, ncm_id, song_url, note, images, public, created_at FROM diary`;

/** 公开记录列表（可选按 kind 过滤、限量）。 */
export async function listPublicDiary(
  db: D1Database,
  opts: { kind?: DiaryItem['kind']; limit?: number } = {},
): Promise<DiaryItem[]> {
  let sql = `${DIARY_SELECT} WHERE public = 1`;
  const binds: unknown[] = [];
  if (opts.kind) {
    sql += ' AND kind = ?';
    binds.push(opts.kind);
  }
  sql += ' ORDER BY created_at DESC';
  if (opts.limit) {
    sql += ' LIMIT ?';
    binds.push(opts.limit);
  }
  const { results } = await db
    .prepare(sql)
    .bind(...binds)
    .all<DiaryRow>();
  return results.map(rowToDiary);
}

/** 全部记录（后台/登录视图，含私有）。 */
export async function listAllDiary(db: D1Database): Promise<DiaryItem[]> {
  const { results } = await db
    .prepare(`${DIARY_SELECT} ORDER BY created_at DESC, id DESC`)
    .all<DiaryRow>();
  return results.map(rowToDiary);
}

export async function getDiaryByDbId(db: D1Database, id: number): Promise<DiaryItem | undefined> {
  const row = await db.prepare(`${DIARY_SELECT} WHERE id = ?`).bind(id).first<DiaryRow>();
  return row ? rowToDiary(row) : undefined;
}

/** 最新一首公开听歌记录（首页"最近在听"）。 */
export async function getLatestPublicSong(db: D1Database): Promise<DiaryItem | undefined> {
  const row = await db
    .prepare(`${DIARY_SELECT} WHERE kind = 'song' AND public = 1 ORDER BY created_at DESC LIMIT 1`)
    .first<DiaryRow>();
  return row ? rowToDiary(row) : undefined;
}

export async function createDiary(db: D1Database, input: DiaryInput): Promise<number> {
  const res = await db
    .prepare(
      `INSERT INTO diary (kind, title, artist, album, cover, ncm_id, song_url, note, images, public)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.kind,
      input.title,
      input.artist ?? '',
      input.album ?? '',
      input.cover ?? '',
      input.ncmId ?? null,
      input.songUrl ?? '',
      input.note ?? '',
      JSON.stringify(input.images ?? []),
      input.public ? 1 : 0,
    )
    .run();
  return Number(res.meta.last_row_id);
}

export async function updateDiary(db: D1Database, id: number, input: DiaryInput): Promise<void> {
  await db
    .prepare(
      `UPDATE diary SET kind = ?, title = ?, artist = ?, album = ?, cover = ?, ncm_id = ?,
       song_url = ?, note = ?, images = ?, public = ?, updated_at = datetime('now')
       WHERE id = ?`,
    )
    .bind(
      input.kind,
      input.title,
      input.artist ?? '',
      input.album ?? '',
      input.cover ?? '',
      input.ncmId ?? null,
      input.songUrl ?? '',
      input.note ?? '',
      JSON.stringify(input.images ?? []),
      input.public ? 1 : 0,
      id,
    )
    .run();
}

export async function deleteDiary(db: D1Database, id: number): Promise<void> {
  await db.prepare('DELETE FROM diary WHERE id = ?').bind(id).run();
}

// ── 统一内容流（作品 + 文章 + 日记 → 首页/整合页瀑布流） ──────────────────

export type FeedKind = 'music' | 'code' | 'post' | 'song' | 'photo' | 'text';

export interface FeedItem {
  key: string;
  date: Date;
  kind: FeedKind;
  title: string;
  subtitle: string; // 歌手 / 类型等
  summary: string;
  cover?: string;
  image?: string; // 照片（diary photo 的第一张图）
  audio?: string;
  link?: string; // 外部链接（作品 / 网易云）
  detailHref?: string; // 内部详情页
  /** 瀑布流高度权重（1-3，估算卡片高度） */
  weight: number;
}

/** 合并流：公开的作品 + 文章 + 日记，按日期倒序（works/posts 按语言过滤，日记不分语言）。 */
export async function getMergedFeed(
  db: D1Database,
  locale: Locale,
  opts: { limit?: number } = {},
): Promise<FeedItem[]> {
  const [works, posts, diary] = await Promise.all([
    listAllWorks(db).then((list) => list.filter((w) => w.id.startsWith(`${locale}/`))),
    listAllPosts(db).then((list) => list.filter((p) => p.id.startsWith(`${locale}/`))),
    listPublicDiary(db),
  ]);

  const items: FeedItem[] = [];

  for (const w of works) {
    const isMusic = w.data.type === 'music';
    items.push({
      key: `work-${w.dbId}`,
      date: w.data.date,
      kind: isMusic ? 'music' : 'code',
      title: w.data.title,
      subtitle: isMusic ? 'music' : 'code',
      summary: w.data.summary,
      cover: w.data.cover,
      audio: isMusic ? w.data.audio : undefined,
      link: w.data.link,
      detailHref: `${locale === 'zh' ? '' : '/en'}/works/${slugFromId(w.id)}/`,
      weight: w.data.audio || w.data.cover ? 3 : 2,
    });
  }

  for (const p of posts) {
    items.push({
      key: `post-${p.dbId}`,
      date: p.data.date,
      kind: 'post',
      title: p.data.title,
      subtitle: 'thought',
      summary: p.data.summary,
      detailHref: `${locale === 'zh' ? '' : '/en'}/thoughts/${slugFromId(p.id)}/`,
      weight: p.data.summary.length > 100 ? 2 : 1,
    });
  }

  for (const d of diary) {
    const base = {
      key: `diary-${d.dbId}`,
      date: d.createdAt,
      title: d.title || d.artist || 'untitled',
      subtitle: d.artist,
      summary: d.note,
      detailHref: undefined,
      weight: 2,
    };
    if (d.kind === 'song') {
      items.push({
        ...base,
        kind: 'song',
        subtitle: d.artist,
        summary: d.note,
        cover: d.cover,
        link: d.songUrl || undefined,
        weight: d.cover ? 2 : 1,
      });
    } else if (d.kind === 'photo') {
      items.push({
        ...base,
        kind: 'photo',
        subtitle: 'photo',
        summary: d.note,
        image: d.images[0] || d.cover || undefined,
        weight: 3,
      });
    } else {
      items.push({
        ...base,
        kind: 'text',
        subtitle: 'text',
        summary: d.note,
        weight: d.note.length > 100 ? 2 : 1,
      });
    }
  }

  items.sort((a, b) => b.date.getTime() - a.date.getTime());
  return opts.limit ? items.slice(0, opts.limit) : items;
}
