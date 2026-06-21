-- ============================================================
-- מצאתי אותך — טבלת משוב (feedback) + הרשאת אדמין
-- אידמפוטנטי: ניתן להריץ שוב בלי נזק.
-- ============================================================

-- 1) עמודת is_admin על פרופילים (משמשת בלוח הניהול)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) טבלת המשוב
CREATE TABLE IF NOT EXISTS feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general'
                CHECK (category IN ('bug','feature','general','other')),
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','seen','resolved')),
  admin_note  TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_status_idx     ON feedback (status);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);

-- 3) RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- פונקציית עזר: האם המשתמש הנוכחי אדמין
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  );
$$;

-- משתמש יכול להגיש משוב משלו
DROP POLICY IF EXISTS "feedback_insert_own" ON feedback;
CREATE POLICY "feedback_insert_own" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- משתמש רואה את המשוב של עצמו; אדמין רואה הכל
DROP POLICY IF EXISTS "feedback_read" ON feedback;
CREATE POLICY "feedback_read" ON feedback
  FOR SELECT USING (auth.uid() = user_id OR is_current_user_admin());

-- רק אדמין יכול לעדכן (סטטוס / הערה)
DROP POLICY IF EXISTS "feedback_update_admin" ON feedback;
CREATE POLICY "feedback_update_admin" ON feedback
  FOR UPDATE USING (is_current_user_admin());

-- ============================================================
-- 4) Storage bucket לצילומי מסך של משוב
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-screenshots', 'feedback-screenshots', TRUE)
ON CONFLICT (id) DO NOTHING;

-- כל אחד מאומת יכול להעלות לתיקייה משלו (path מתחיל ב-user_id/)
DROP POLICY IF EXISTS "feedback_shots_insert" ON storage.objects;
CREATE POLICY "feedback_shots_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feedback-screenshots'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- קריאה ציבורית (ה-bucket public) — מאפשר תצוגת התמונות בלוח הניהול
DROP POLICY IF EXISTS "feedback_shots_read" ON storage.objects;
CREATE POLICY "feedback_shots_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'feedback-screenshots');

NOTIFY pgrst, 'reload schema';
