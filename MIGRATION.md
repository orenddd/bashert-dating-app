# מעבר מ-Supabase ל-Convex

המערכת עברה מ-Supabase (Postgres + Auth + Storage) ל-Convex. המסמך מסכם מה השתנה,
איך ההגירה בוצעה, ומה נדרש כדי להעלות לפרודקשן.

## מה השתנה

| קודם (Supabase) | עכשיו (Convex) |
| --- | --- |
| Postgres + RLS | `convex/schema.ts` + הרשאות בתוך כל query/mutation |
| Supabase Auth (bcrypt) | Convex Auth עם ספק Password, מוגדר ל-bcrypt כדי לשמור על הסיסמאות הקיימות |
| Supabase Storage (באקטים ציבוריים) | Convex Storage; ה-URL נפתר בצד השרת ומוחזר בשדה `url` |
| טריגרים ב-SQL | לוגיקה בתוך mutations (ראו למטה) |
| Realtime channels | `useQuery` של Convex — מתעדכן מעצמו |
| `/api/tracking`, `/api/admin/delete-user` | `convex/tracking.ts`, `convex/admin.ts` |
| middleware של Supabase ב-`src/proxy.ts` | `convexAuthNextjsMiddleware` |

### טריגרים שהומרו ללוגיקה בקוד

- `check_mutual_like` → `convex/likes.ts:send` יוצר התאמה כששני הצדדים סימנו לייק
- `on_request_accepted` → `convex/messages.ts:acceptRequest` יוצר שיחה + הודעה ראשונה
- `update_conversation_preview` → `convex/messages.ts:send` מעדכן את תצוגת השיחה
- `increment_view_count` → `convex/profiles.ts:incrementViews`
- `ON DELETE CASCADE` → `convex/admin.ts:deleteUser` מוחק במפורש מכל הטבלאות

## סיסמאות

Supabase שמר hash בפורמט `$2a$10$` (bcrypt). Convex Auth משתמש כברירת מחדל ב-Scrypt,
ולכן `convex/auth.ts` מגדיר `crypto` מותאם שמשתמש ב-bcryptjs. ה-hash-ים יובאו כמות שהם
ל-`authAccounts.secret`, וכל המשתמשים הקיימים מתחברים עם הסיסמה שהייתה להם.

חשוב: יש להשתמש ב-`bcrypt.hashSync` / `bcrypt.compareSync` בלבד. ה-API האסינכרוני של
bcryptjs מתזמן עבודה עם `setTimeout`, ש-Convex אוסר בתוך mutation — ושם בדיוק רצה בדיקת הסיסמה.

## סקריפטי ההגירה

תחת `scripts/migrate/` (מריצים מתיקיית השורש):

| סקריפט | תפקיד |
| --- | --- |
| `01-inspect.mjs` | סקירת הסכמה והנתונים ב-Supabase |
| `02-export.mjs` | ייצוא כל הטבלאות + `auth.users` (כולל ה-hash) ל-`migration-data/` |
| `03-import.mjs` | ייבוא ל-Convex דרך `convex/migrate.ts` |
| `04-media.mjs` | העברת קבצי המדיה ל-Convex Storage וקישורם לרשומות |
| `05-verify-login.mjs` | אימות שסיסמה מ-Supabase עובדת ב-Convex |
| `06-verify-chat.mjs` | אימות זרימת בקשה → שיחה → הודעות |

`migration-data/` מכיל hash-ים של סיסמאות ולכן נמצא ב-`.gitignore`.

`convex/migrate.ts` הוא כלי חד-פעמי (פונקציות פנימיות בלבד) — אפשר למחוק אותו
אחרי שההגירה הושלמה גם בפרודקשן.

## מצב נוכחי

ההגירה הושלמה בשתי הסביבות:

- פיתוח: `rugged-mammoth-669`
- פרודקשן: `capable-stoat-757` — מחובר ל-https://www.matzatiotcha.com

בשתיהן: 93 משתמשים, 92 פרופילים, 182 קבצי מדיה, התאמה אחת ו-3 משובים.

הרצת סקריפט מול הפרודקשן: `CONVEX_ENV=prod node scripts/migrate/03-import.mjs`.

## דיפלוי

הבילד ב-Vercel מריץ `next build` בלבד ומשתמש ב-`NEXT_PUBLIC_CONVEX_URL`.
**שינוי בפונקציות של Convex לא עולה לפרודקשן עם ה-push** — צריך להריץ בנפרד:

```bash
npx convex deploy
```

## מה נשאר

- להסיר מ-Vercel את `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  ו-`SUPABASE_SERVICE_ROLE_KEY` — הם נשמרו כדי לאפשר חזרה לבילד הקודם,
  ואפשר למחוק אותם יחד עם סגירת פרויקט ה-Supabase.
- למחוק את `convex/migrate.ts` ואת `scripts/migrate/` כשכבר לא יהיה בהם צורך.
