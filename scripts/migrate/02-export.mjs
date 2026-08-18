// ייצוא כל הנתונים מ-Supabase לקבצי JSON תחת migration-data/
import { runSql, writeJson, loadEnv } from './lib.mjs'
import { createClient } from '@supabase/supabase-js'

const TABLES = [
  'profiles', 'photos', 'likes', 'matches', 'message_requests',
  'conversations', 'messages', 'subscriptions', 'blocks', 'reports', 'feedback',
]

// auth.users — כולל encrypted_password, שאינו חשוף דרך PostgREST
const users = await runSql(`
  select id, email, encrypted_password, email_confirmed_at, phone,
         raw_user_meta_data, created_at, updated_at, last_sign_in_at,
         banned_until, deleted_at, is_anonymous
  from auth.users
  where deleted_at is null
  order by created_at;
`)
writeJson('auth_users.json', users)
console.log(`auth.users: ${users.length}`)

for (const t of TABLES) {
  const rows = await runSql(`select * from public."${t}" order by created_at;`)
  writeJson(`${t}.json`, rows)
  console.log(`${t.padEnd(18)} ${rows.length}`)
}

// רשימת קבצים בכל הבאקטים של Storage
const env = loadEnv()
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: buckets } = await sb.storage.listBuckets()
const files = []
async function walk(bucket, prefix = '') {
  const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`)
  for (const item of data ?? []) {
    const full = prefix ? `${prefix}/${item.name}` : item.name
    if (item.id === null) await walk(bucket, full)          // תיקייה
    else files.push({ bucket, path: full, size: item.metadata?.size ?? 0, mimetype: item.metadata?.mimetype })
  }
}
for (const b of buckets ?? []) await walk(b.name)
writeJson('storage_files.json', files)
console.log(`storage files: ${files.length} (${(files.reduce((s, f) => s + f.size, 0) / 1e6).toFixed(1)} MB)`)
