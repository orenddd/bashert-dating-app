// אימות מקצה-לקצה: משתמש נוצר ב-Supabase עם סיסמה ידועה, ה-hash שלו מיובא
// ל-Convex, ואז מתבצעת התחברות אמיתית מול Convex Auth עם אותה סיסמה.
import { createClient } from '@supabase/supabase-js'
import { ConvexHttpClient } from 'convex/browser'
import { execFileSync } from 'node:child_process'
import { loadEnv, runSql, convexArgs, convexUrl } from './lib.mjs'

const env = loadEnv()
const EMAIL = `migration-check-${Date.now()}@example.com`
const PASSWORD = 'S3cret-Migration-Check!'

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

console.log('יעד:', convexUrl(env))
console.log('1. יצירת משתמש זמני ב-Supabase...')
const { data: created, error } = await sb.auth.admin.createUser({
  email: EMAIL, password: PASSWORD, email_confirm: true,
})
if (error) throw error
const userId = created.user.id

try {
  console.log('2. קריאת ה-hash מ-auth.users...')
  const [row] = await runSql(`select id, email, encrypted_password, email_confirmed_at, created_at, updated_at, last_sign_in_at, raw_user_meta_data from auth.users where id = '${userId}';`)
  console.log('   פורמט ה-hash:', row.encrypted_password.slice(0, 7))

  console.log('3. ייבוא ל-Convex...')
  const out = execFileSync('npx', ['convex', 'run', ...convexArgs(), 'migrate:importUsers', JSON.stringify({ batch: [row] })], { encoding: 'utf8' })
  console.log('  ', out.trim().replace(/\s+/g, ' '))

  console.log('4. התחברות מול Convex Auth עם הסיסמה המקורית...')
  const convex = new ConvexHttpClient(convexUrl(env))
  const { api } = await import('../../convex/_generated/api.js')
  const res = await convex.action(api.auth.signIn, {
    provider: 'password',
    params: { email: EMAIL, password: PASSWORD, flow: 'signIn' },
  })
  const ok = !!res?.tokens?.token
  console.log(ok ? '   ✔ ההתחברות הצליחה — הסיסמה מ-Supabase עובדת ב-Convex' : `   ✖ נכשל: ${JSON.stringify(res)}`)

  console.log('5. בדיקת דחייה של סיסמה שגויה...')
  let rejected = false
  try {
    await convex.action(api.auth.signIn, { provider: 'password', params: { email: EMAIL, password: 'wrong-password', flow: 'signIn' } })
  } catch { rejected = true }
  console.log(rejected ? '   ✔ סיסמה שגויה נדחתה' : '   ✖ סיסמה שגויה התקבלה!')

  if (!ok || !rejected) process.exitCode = 1
} finally {
  console.log('6. ניקוי...')
  await sb.auth.admin.deleteUser(userId)
  const outUsers = execFileSync('npx', ['convex', 'run', ...convexArgs(), 'migrate:deleteBySupabaseId', JSON.stringify({ supabase_id: userId })], { encoding: 'utf8' })
  console.log('  ', outUsers.trim().replace(/\s+/g, ' '))
}
