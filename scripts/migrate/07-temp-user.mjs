// מקים/מוחק משתמש בדיקה זמני: נוצר ב-Supabase עם סיסמה ידועה, וה-hash שלו
// מיובא ל-Convex — כדי לבדוק התחברות אמיתית דרך הדפדפן באתר החי.
import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'
import { loadEnv, runSql, convexArgs } from './lib.mjs'
import fs from 'node:fs'

const env = loadEnv()
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const STATE = 'migration-data/temp-user.json'
const mode = process.argv[2]

if (mode === 'create') {
  const email = `live-check-${Date.now()}@example.com`
  const password = 'LiveCheck-Migration-1!'
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  const [row] = await runSql(`select id, email, encrypted_password, email_confirmed_at, created_at, updated_at, last_sign_in_at, raw_user_meta_data from auth.users where id = '${data.user.id}';`)
  execFileSync('npx', ['convex', 'run', ...convexArgs(), 'migrate:importUsers', JSON.stringify({ batch: [row] })], { encoding: 'utf8' })
  fs.writeFileSync(STATE, JSON.stringify({ email, password, supabaseId: data.user.id }))
  console.log(JSON.stringify({ email, password }))
} else if (mode === 'cleanup') {
  const { email, supabaseId } = JSON.parse(fs.readFileSync(STATE, 'utf8'))
  await sb.auth.admin.deleteUser(supabaseId)
  const out = execFileSync('npx', ['convex', 'run', ...convexArgs(), 'migrate:devDeleteUserByEmail', JSON.stringify({ email })], { encoding: 'utf8' })
  fs.unlinkSync(STATE)
  console.log('נוקה:', email, out.trim().replace(/\s+/g, ' '))
} else {
  console.error('שימוש: node 07-temp-user.mjs create|cleanup')
  process.exit(1)
}
