import { env } from 'cloudflare:workers';
import type { Locale } from '../i18n';
import type { PostInput, WorkInput } from './data';

/**
 * 后台管理共享逻辑：会话鉴权、密码校验、表单解析与校验。
 *
 * 会话使用 Astro Session（KV 存储 + Cookie），管理员标志存于 key `admin`。
 */

export interface SessionLike {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, opts?: { ttl?: number }): void;
  destroy(): void;
}

/** 是否已登录管理员。 */
export async function isAuthed(session: SessionLike | undefined): Promise<boolean> {
  if (!session) return false;
  try {
    return (await session.get('admin')) === true;
  } catch {
    return false;
  }
}

/** 校验后台密码（来自 ADMIN_PASSWORD 环境变量/密钥）。 */
export function verifyPassword(input: string): boolean {
  const expected = env.ADMIN_PASSWORD;
  return typeof expected === 'string' && expected.length > 0 && input === expected;
}

/** 标记会话为已登录（7 天有效）。 */
export function markAuthed(session: SessionLike | undefined): void {
  session?.set('admin', true, { ttl: 60 * 60 * 24 * 7 });
}

/**
 * API 鉴权：管理员 Session 或 App Bearer 令牌（APP_TOKEN secret）任一通过即可。
 * 原生 App 无法维护网站登录会话，自用 App 持有 APP_TOKEN，每次请求带
 * `Authorization: Bearer <token>`；网站后台仍走 Session。
 */
export async function isAuthedApi(
  session: SessionLike | undefined,
  authHeader: string | null,
): Promise<boolean> {
  if (await isAuthed(session)) return true;
  const expected = env.APP_TOKEN;
  if (typeof expected !== 'string' || expected.length === 0) return false;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim() ?? '';
  return token.length > 0 && token === expected;
}

// ── 表单解析与校验 ─────────────────────────────────────────────────────────

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseTags(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/[,，、]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseWorkForm(form: FormData): ParseResult<WorkInput> {
  const locale: Locale = form.get('locale') === 'en' ? 'en' : 'zh';
  const title = String(form.get('title') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim();
  const date = String(form.get('date') ?? '').trim();
  const typeRaw = String(form.get('type') ?? '');

  if (!title) return { ok: false, error: '标题不能为空' };
  if (!SLUG_RE.test(slug))
    return { ok: false, error: 'slug 只能是小写字母、数字和连字符（如 ambient-drift）' };
  if (!DATE_RE.test(date)) return { ok: false, error: '日期格式应为 YYYY-MM-DD（如 2026-06-20）' };

  return {
    ok: true,
    value: {
      locale,
      slug,
      title,
      type: typeRaw === 'code' ? 'code' : 'music',
      date,
      summary: String(form.get('summary') ?? '').trim(),
      tags: parseTags(form.get('tags')),
      link: String(form.get('link') ?? '').trim() || undefined,
      audio: String(form.get('audio') ?? '').trim() || undefined,
      cover: String(form.get('cover') ?? '').trim() || undefined,
      featured: form.get('featured') === 'on',
      body: String(form.get('body') ?? ''),
    },
  };
}

export function parsePostForm(form: FormData): ParseResult<PostInput> {
  const locale: Locale = form.get('locale') === 'en' ? 'en' : 'zh';
  const title = String(form.get('title') ?? '').trim();
  const slug = String(form.get('slug') ?? '').trim();
  const date = String(form.get('date') ?? '').trim();

  if (!title) return { ok: false, error: '标题不能为空' };
  if (!SLUG_RE.test(slug)) return { ok: false, error: 'slug 只能是小写字母、数字和连字符' };
  if (!DATE_RE.test(date)) return { ok: false, error: '日期格式应为 YYYY-MM-DD' };

  return {
    ok: true,
    value: {
      locale,
      slug,
      title,
      date,
      summary: String(form.get('summary') ?? '').trim(),
      tags: parseTags(form.get('tags')),
      body: String(form.get('body') ?? ''),
    },
  };
}

/** 把 D1 写入的 UNIQUE 约束错误转成用户可读信息。 */
export function constraintMessage(error: unknown): string {
  const msg = String((error as Error)?.message ?? error);
  if (/UNIQUE|no such|constraint/i.test(msg)) {
    return '保存失败：该语言下已存在相同 slug，请换一个';
  }
  return `保存失败：${msg}`;
}
