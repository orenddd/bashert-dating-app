// ייבוא כל הנתונים ל-Convex דרך הפונקציות הפנימיות ב-convex/migrate.ts
import { execFileSync } from 'node:child_process'
import { readJson, convexArgs } from './lib.mjs'

const MAX_ARG_BYTES = 80_000 // שומר על שורת פקודה בטוחה

function run(fn, args) {
  const payload = JSON.stringify(args)
  const out = execFileSync('npx', ['convex', 'run', ...convexArgs(), fn, payload], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const jsonStart = out.indexOf('{')
  return jsonStart >= 0 ? JSON.parse(out.slice(jsonStart)) : out.trim()
}

// חלוקה לאצוות לפי גודל ה-JSON בפועל
function batches(rows) {
  const out = []
  let current = []
  let size = 0
  for (const row of rows) {
    const rowSize = JSON.stringify(row).length
    if (current.length && size + rowSize > MAX_ARG_BYTES) {
      out.push(current)
      current = []
      size = 0
    }
    current.push(row)
    size += rowSize
  }
  if (current.length) out.push(current)
  return out
}

function importTable(file, fn) {
  const rows = readJson(file)
  if (!rows.length) { console.log(`${file.padEnd(24)} 0 (ריק)`); return }
  let created = 0
  const missing = new Set()
  for (const batch of batches(rows)) {
    const res = run(fn, { batch })
    created += res.created ?? 0
    for (const m of res.missing ?? []) missing.add(m)
  }
  console.log(`${file.padEnd(24)} ${created}/${rows.length} יובאו${missing.size ? ` — ${missing.size} ללא משתמש תואם` : ''}`)
}

console.log('— ניקוי פרופילים שנוצרו אוטומטית —')
console.log(run('migrate:clearAutoCreatedProfiles', {}))

importTable('auth_users.json', 'migrate:importUsers')
importTable('profiles.json', 'migrate:importProfiles')
importTable('photos.json', 'migrate:importPhotos')
importTable('likes.json', 'migrate:importLikes')
importTable('matches.json', 'migrate:importMatches')
importTable('message_requests.json', 'migrate:importRequests')
importTable('conversations.json', 'migrate:importConversations')
importTable('messages.json', 'migrate:importMessages')
importTable('subscriptions.json', 'migrate:importSubscriptions')
importTable('blocks.json', 'migrate:importBlocks')
importTable('reports.json', 'migrate:importReports')
importTable('feedback.json', 'migrate:importFeedback')

// קישור בקשות הודעה לשיחות שנוצרו מהן
const requests = readJson('message_requests.json').filter(r => r.conversation_id)
if (requests.length) {
  const pairs = requests.map(r => ({ request_legacy_id: r.id, conversation_legacy_id: r.conversation_id }))
  console.log('קישור בקשות לשיחות:', run('migrate:linkRequestConversations', { pairs }))
}

console.log('\n— סיכום —')
console.log(run('migrate:stats', {}))
