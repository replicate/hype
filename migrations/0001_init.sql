-- Create repositories table
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT NOT NULL,
  source TEXT NOT NULL,
  username TEXT NOT NULL,
  name TEXT,
  description TEXT,
  stars INTEGER DEFAULT 0,
  url TEXT,
  created_at TEXT,
  inserted_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (id, source)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_repos_source ON repositories(source);
CREATE INDEX IF NOT EXISTS idx_repos_created ON repositories(created_at);
CREATE INDEX IF NOT EXISTS idx_repos_inserted ON repositories(inserted_at);
CREATE INDEX IF NOT EXISTS idx_repos_stars ON repositories(stars DESC);
