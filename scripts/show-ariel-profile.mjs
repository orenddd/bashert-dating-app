// סקריפט חד-פעמי: איתור פרופילים עם שנת לידה חסרה/לא סבירה + חיפוש לפי שם משפחה
// הרצה: node scripts/show-ariel-profile.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
)
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const year = new Date().getFullYear()
const { data: bad, error: e1 } = await supabase
  .from('profiles')
  .select('user_id, first_name, last_name, display_name, birth_year, date_of_birth, city')
  .or(`birth_year.is.null,birth_year.gt.${year - 18},birth_year.lt.${year - 100}`)
if (e1) throw e1
console.log('--- פרופילים עם שנת לידה חסרה או מחוץ לטווח ---')
console.table(bad)

const { data: heh, error: e2 } = await supabase
  .from('profiles')
  .select('user_id, first_name, last_name, display_name, birth_year, date_of_birth, city')
  .ilike('last_name', 'ה%')
if (e2) throw e2
console.log('--- פרופילים ששם המשפחה מתחיל ב-ה ---')
console.table(heh)
