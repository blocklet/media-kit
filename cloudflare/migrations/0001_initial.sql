-- Migration: 0001_initial
-- Media Kit initial schema for Cloudflare D1

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  originalname TEXT,
  mimetype TEXT,
  size INTEGER,
  remark TEXT DEFAULT '',
  folder_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_uploads_filename ON uploads(filename);
CREATE INDEX idx_uploads_folder_id ON uploads(folder_id);
CREATE INDEX idx_uploads_mimetype ON uploads(mimetype);
CREATE INDEX idx_uploads_created_by ON uploads(created_by);
CREATE INDEX idx_uploads_created_at ON uploads(created_at);

CREATE TABLE IF NOT EXISTS upload_tags (
  upload_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (upload_id, tag),
  FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);

CREATE INDEX idx_upload_tags_tag ON upload_tags(tag, upload_id);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_folders_name ON folders(name);

CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  upload_id TEXT,
  key TEXT NOT NULL,
  final_key TEXT,
  total_size INTEGER,
  part_size INTEGER,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT,
  expires_at TEXT
);

CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_expires ON upload_sessions(expires_at);
