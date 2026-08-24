-- 0002_diary.sql
-- 记录（听歌日记 / 感想 / 照片）。M3 先落地 song，text/photo 由 M4 使用。

CREATE TABLE IF NOT EXISTS diary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'song' CHECK (kind IN ('song', 'text', 'photo')),
  title TEXT NOT NULL DEFAULT '',      -- 歌名 / 感想标题 / 照片标题
  artist TEXT NOT NULL DEFAULT '',     -- 歌手（song）
  album TEXT NOT NULL DEFAULT '',      -- 专辑（song，可选）
  cover TEXT NOT NULL DEFAULT '',      -- 封面（本站 /media/... 或外链，song）
  ncm_id INTEGER,                      -- 网易云歌曲 id（song）
  song_url TEXT NOT NULL DEFAULT '',   -- 网易云原链接（song）
  note TEXT NOT NULL DEFAULT '',       -- 配文 / 感想正文
  images TEXT NOT NULL DEFAULT '[]',   -- 图片 key 列表（JSON，photo）
  public INTEGER NOT NULL DEFAULT 0,   -- 0=私有 1=公开
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_diary_song_public ON diary (kind, public, created_at DESC);
