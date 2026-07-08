-- Rushton View 7th Ward Young Men's Activity Tracker
-- D1 schema. Apply with:
--   wrangler d1 execute ym-activity-tracker --file=./schema.sql [--remote]

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_date TEXT NOT NULL,        -- ISO 'YYYY-MM-DD'
  week_of_month INTEGER,              -- 1-5, informational only
  meeting_type TEXT,                  -- e.g. 'Quorum', 'YM Combined', 'YM/YW Combined', 'Stake'
  quorum_group TEXT,                  -- 'Deacons' | 'Teachers' | 'Priests' | 'YW' | 'Stake' | 'All' | free text for holidays/breaks
  category TEXT,                      -- 'Spiritual' | 'Physical' | 'Social' | 'Intellectual' | null
  activity_name TEXT,
  needed TEXT,                        -- what's needed to make it happen
  notes TEXT,                         -- camps/weekend activities/school closure notes
  in_charge TEXT,                     -- JSON array of strings, e.g. '["Bro. Larsen","Devan"]'
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS birthdays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  birth_month INTEGER NOT NULL,       -- 1-12
  birth_day INTEGER NOT NULL,         -- 1-31
  quorum_group TEXT,                  -- 'Deacons' | 'Teachers' | 'Priests' | null
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS discussion_leaders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_date TEXT NOT NULL,      -- ISO 'YYYY-MM-DD', the Sunday
  quorum_group TEXT NOT NULL,         -- 'Deacons' | 'Teachers' | 'Priests'
  leader_name TEXT NOT NULL,
  topic TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_group ON activities(quorum_group);
CREATE INDEX IF NOT EXISTS idx_discussion_leaders_group ON discussion_leaders(quorum_group);
