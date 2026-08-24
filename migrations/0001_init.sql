-- 0001_init.sql
-- lordestar 内容数据库初始化：works（作品）+ posts（随想/想法）
-- 从 Markdown 内容集合迁移，保持 locale+slug 双语约定（zh/* 与 en/*）。

CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  locale TEXT NOT NULL,                -- 'zh' | 'en'
  slug TEXT NOT NULL,                  -- 文件名（不含扩展名）
  title TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'music',  -- 'music' | 'code'
  date TEXT NOT NULL DEFAULT '',       -- ISO 日期
  summary TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',     -- JSON 数组
  link TEXT,
  audio TEXT,
  cover TEXT,
  featured INTEGER NOT NULL DEFAULT 0, -- 0 | 1
  body TEXT NOT NULL DEFAULT '',       -- Markdown 正文
  UNIQUE (locale, slug)
);

CREATE INDEX IF NOT EXISTS idx_works_locale_date ON works (locale, date DESC);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  locale TEXT NOT NULL,                -- 'zh' | 'en'
  slug TEXT NOT NULL,                  -- 文件名（不含扩展名）
  title TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',       -- ISO 日期
  summary TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',     -- JSON 数组
  images TEXT NOT NULL DEFAULT '[]',   -- JSON 数组（照片型想法的 R2 key，预留）
  body TEXT NOT NULL DEFAULT '',       -- Markdown 正文
  UNIQUE (locale, slug)
);

CREATE INDEX IF NOT EXISTS idx_posts_locale_date ON posts (locale, date DESC);
