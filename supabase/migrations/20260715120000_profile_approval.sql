-- ============================================================
-- מצאתי אותך — אישור פרופילים ידני ע"י מנהל
-- אידמפוטנטי: ניתן להריץ שוב בלי נזק.
-- ============================================================
-- כל פרופיל חדש נכנס במצב 'pending' (ממתין לאישור) ואינו מופיע
-- בגילוי עד שמנהל מאשר אותו. כל הפרופילים הקיימים מקבלים 'pending'
-- אוטומטית (ברירת המחדל של העמודה), כך שגם הם יעברו אישור ידני.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
                            CHECK (approval_status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS approval_note   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS approved_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by     UUID;

CREATE INDEX IF NOT EXISTS idx_profiles_approval ON profiles (approval_status);

-- ============================================================
-- RLS — מנהל יכול לעדכן כל פרופיל (למשל: לאשר/לדחות)
-- הפונקציה is_current_user_admin() הוגדרה במיגרציית הפידבק.
-- ============================================================
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_current_user_admin());

NOTIFY pgrst, 'reload schema';
