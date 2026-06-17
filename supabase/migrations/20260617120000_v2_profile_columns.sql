-- v2 — עמודות פרופיל מורחבות (חסרות ב-DB החי), idempotent
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marital_status     TEXT NOT NULL DEFAULT 'single'
                             CHECK (marital_status IN ('single','divorced','widowed')),
  ADD COLUMN IF NOT EXISTS phone_number       TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS birth_year         INTEGER CHECK (birth_year > 1930 AND birth_year < 2010),
  ADD COLUMN IF NOT EXISTS relationship_goal  TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS children_count     INTEGER NOT NULL DEFAULT 0
                             CHECK (children_count >= 0 AND children_count <= 20),
  ADD COLUMN IF NOT EXISTS children_future    TEXT NOT NULL DEFAULT ''
                             CHECK (children_future IN ('','want_must','want_sometime','undecided','dont_want','have_maybe_more','have_enough')),
  ADD COLUMN IF NOT EXISTS seeking_status     TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seeking_with_kids  TEXT NOT NULL DEFAULT ''
                             CHECK (seeking_with_kids IN ('','yes','no','dont_mind')),
  ADD COLUMN IF NOT EXISTS age_pref_min       INTEGER NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS age_pref_max       INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS distance_pref_km   INTEGER NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS residence_intent   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages          TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS romantic_vision    TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS friday_night       TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS saturday_morning   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hobbies            TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_questions     JSONB  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS flight_mode_active BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flight_mode_city   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS flight_mode_lat    DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS flight_mode_lng    DECIMAL(11,8);

ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
                            CHECK (media_type IN ('image','video','audio'));

NOTIFY pgrst, 'reload schema';
