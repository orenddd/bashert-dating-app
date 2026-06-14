-- ============================================================
-- מצאתי אותך — Supabase Schema
-- ============================================================
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- Make sure to enable the pgcrypto and uuid-ossp extensions first
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (one per auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  first_name    TEXT NOT NULL DEFAULT '',
  last_name     TEXT NOT NULL DEFAULT '',
  gender        TEXT NOT NULL DEFAULT 'other'
                  CHECK (gender IN ('male','female','other')),
  seeking       TEXT NOT NULL DEFAULT 'both'
                  CHECK (seeking IN ('male','female','other','both')),
  date_of_birth DATE,
  city          TEXT DEFAULT '',
  state         TEXT DEFAULT '',
  country       TEXT DEFAULT 'US',
  latitude      DECIMAL(10,8),
  longitude     DECIMAL(11,8),
  bio           TEXT DEFAULT '',
  occupation    TEXT DEFAULT '',
  education     TEXT DEFAULT '',
  religious_level TEXT NOT NULL DEFAULT 'masorti'
                    CHECK (religious_level IN ('hiloni','masorti','dati_light','dati','haredi')),
  shomer_shabbat  BOOLEAN NOT NULL DEFAULT FALSE,
  kosher_level  TEXT NOT NULL DEFAULT 'none'
                  CHECK (kosher_level IN ('none','kosher_home','kosher_out','strict')),
  synagogue_attendance TEXT NOT NULL DEFAULT 'never'
                         CHECK (synagogue_attendance IN ('never','holidays','monthly','weekly','daily')),
  community_background TEXT NOT NULL DEFAULT 'other'
                          CHECK (community_background IN ('ashkenazi','sephardic','mizrahi','yemenite','mixed','other')),
  hebrew_fluency TEXT NOT NULL DEFAULT 'none'
                   CHECK (hebrew_fluency IN ('none','basic','conversational','fluent','native')),
  aliyah_plan   TEXT NOT NULL DEFAULT 'no'
                  CHECK (aliyah_plan IN ('no','considering','planning','already_made')),
  children_status TEXT NOT NULL DEFAULT 'no_children'
                    CHECK (children_status IN ('no_children','has_children','wants_children','does_not_want','open')),
  wants_children BOOLEAN,
  height_cm     INTEGER CHECK (height_cm > 100 AND height_cm < 250),
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  is_online     BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  profile_complete BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
                      CHECK (subscription_tier IN ('free','gold','platinum')),
  boost_active_until TIMESTAMPTZ,
  views_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photos
CREATE TABLE IF NOT EXISTS photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  order_index   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Likes (including super-likes)
CREATE TABLE IF NOT EXISTS likes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_super_like BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

-- Matches (mutual likes — auto-created by trigger)
CREATE TABLE IF NOT EXISTS matches (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Message requests (direct message without mutual like)
CREATE TABLE IF NOT EXISTS message_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_message  TEXT NOT NULL CHECK (char_length(initial_message) BETWEEN 1 AND 500),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','accepted','declined')),
  conversation_id  UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_user_id, to_user_id)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id              UUID REFERENCES matches(id) ON DELETE SET NULL,
  request_id            UUID REFERENCES message_requests(id) ON DELETE SET NULL,
  participant1_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_preview  TEXT NOT NULL DEFAULT '',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (participant1_id <> participant2_id)
);

-- Add FK from message_requests to conversations (after conversations table exists)
ALTER TABLE message_requests
  ADD CONSTRAINT fk_conversation
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions (Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier                  TEXT NOT NULL CHECK (tier IN ('free','gold','platinum')),
  starts_at             TIMESTAMPTZ NOT NULL,
  ends_at               TIMESTAMPTZ,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_subscription_id TEXT,
  stripe_customer_id    TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Blocks
CREATE TABLE IF NOT EXISTS blocks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL CHECK (reason IN ('inappropriate','fake','harassment','spam','other')),
  details     TEXT,
  reviewed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reporter_id <> reported_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id       ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gender         ON profiles(gender, seeking);
CREATE INDEX IF NOT EXISTS idx_profiles_religious      ON profiles(religious_level);
CREATE INDEX IF NOT EXISTS idx_profiles_location       ON profiles(city, state, country);
CREATE INDEX IF NOT EXISTS idx_profiles_online         ON profiles(is_online, last_seen);

CREATE INDEX IF NOT EXISTS idx_photos_user_id          ON photos(user_id, order_index);
CREATE INDEX IF NOT EXISTS idx_photos_primary          ON photos(user_id, is_primary) WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_likes_from              ON likes(from_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_to                ON likes(to_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matches_user1           ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2           ON matches(user2_id);

CREATE INDEX IF NOT EXISTS idx_requests_to             ON message_requests(to_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_from           ON message_requests(from_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_p1        ON conversations(participant1_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_p2        ON conversations(participant2_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation   ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread         ON messages(conversation_id, is_read) WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_blocks_blocker          ON blocks(blocker_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create match when both users like each other
CREATE OR REPLACE FUNCTION check_mutual_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  mutual_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM likes
    WHERE from_user_id = NEW.to_user_id
      AND to_user_id   = NEW.from_user_id
  ) INTO mutual_exists;

  IF mutual_exists THEN
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.from_user_id::text, NEW.to_user_id::text)::uuid,
      GREATEST(NEW.from_user_id::text, NEW.to_user_id::text)::uuid
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_mutual_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION check_mutual_like();

-- Auto-create conversation when message request is accepted
CREATE OR REPLACE FUNCTION on_request_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_conv_id UUID;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' AND NEW.conversation_id IS NULL THEN
    -- Create conversation
    INSERT INTO conversations (request_id, participant1_id, participant2_id, last_message_at, last_message_preview)
    VALUES (NEW.id, NEW.to_user_id, NEW.from_user_id, NEW.created_at, LEFT(NEW.initial_message, 60))
    RETURNING id INTO new_conv_id;

    -- Insert initial message
    INSERT INTO messages (conversation_id, sender_id, content, created_at)
    VALUES (new_conv_id, NEW.from_user_id, NEW.initial_message, NEW.created_at);

    -- Link back to conversation
    UPDATE message_requests SET conversation_id = new_conv_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_request_accepted
  AFTER UPDATE ON message_requests
  FOR EACH ROW EXECUTE FUNCTION on_request_accepted();

-- Update last_message_at on conversations when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_preview()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations
  SET last_message_at      = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 60)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_conversation_preview
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_preview();

-- Increment profile view count
CREATE OR REPLACE FUNCTION increment_view_count(viewed_user_id UUID, viewer_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF viewed_user_id <> viewer_user_id THEN
    UPDATE profiles SET views_count = views_count + 1 WHERE user_id = viewed_user_id;
  END IF;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;

-- Profiles: public read (for discovery), owner write
CREATE POLICY "profiles_read_all"  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert"    ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update"    ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_delete"    ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Photos: public read, owner write
CREATE POLICY "photos_read_all"    ON photos FOR SELECT USING (TRUE);
CREATE POLICY "photos_insert"      ON photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "photos_update"      ON photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "photos_delete"      ON photos FOR DELETE USING (auth.uid() = user_id);

-- Likes: see only your sent/received
CREATE POLICY "likes_read"         ON likes FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "likes_insert"       ON likes FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "likes_delete"       ON likes FOR DELETE USING (auth.uid() = from_user_id);

-- Matches: see only your matches
CREATE POLICY "matches_read"       ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "matches_insert"     ON matches FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Message requests: see only your sent/received; receiver can accept/decline
CREATE POLICY "requests_read"      ON message_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "requests_insert"    ON message_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "requests_update"    ON message_requests FOR UPDATE USING (auth.uid() = to_user_id);

-- Conversations: participants only
CREATE POLICY "conversations_read" ON conversations FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Messages: participants of the conversation only
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
      AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
  )
);

-- Subscriptions: owner only
CREATE POLICY "subscriptions_read" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Blocks: blocker can manage, blocked can see they're blocked (optional)
CREATE POLICY "blocks_read"   ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Reports: reporter can insert, admins review (add service role policy separately)
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or API)
-- ============================================================
-- CREATE STORAGE BUCKET 'profile-photos' (public: true, file size: 5MB, allowed types: image/*)
-- CREATE STORAGE BUCKET 'thumbnails'     (public: true, file size: 500KB, allowed types: image/*)

-- ============================================================
-- REALTIME SUBSCRIPTIONS (enable in Supabase dashboard)
-- ============================================================
-- Enable realtime on: messages, conversations, message_requests, likes

-- ============================================================
-- MIGRATION — new columns for מצאתי אותך v2
-- Run this block AFTER the initial schema above if upgrading
-- ============================================================

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

-- Also support video/audio in photos table
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
                            CHECK (media_type IN ('image','video','audio'));

-- ============================================================
-- ENVIRONMENT VARIABLES NEEDED IN .env.local
-- ============================================================
-- NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
-- SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  (server-side only, never expose)
-- NEXT_PUBLIC_USE_MOCK=false
