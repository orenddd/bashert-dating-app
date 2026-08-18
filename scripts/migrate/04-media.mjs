// העברת קבצי המדיה מ-Supabase Storage ל-Convex Storage
import { execFileSync } from 'node:child_process'
import { loadEnv, convexArgs } from './lib.mjs'

const CONCURRENCY = 4
const env = loadEnv()

function runConvex(fn, args = {}) {
  const out = execFileSync('npx', ['convex', 'run', ...convexArgs(), fn, JSON.stringify(args)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const start = out.search(/[[{"]/)
  return start >= 0 ? JSON.parse(out.slice(start)) : out.trim()
}

const pending = runConvex('migrate:pendingMedia')
console.log(`ממתינים להעברה: ${pending.length} קבצים`)
if (!pending.length) process.exit(0)

// כתובות העלאה — אחת לכל קובץ
const results = []
const failures = []
let done = 0

async function migrateOne(item) {
  const res = await fetch(item.url)
  if (!res.ok) throw new Error(`הורדה נכשלה (${res.status})`)
  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = Buffer.from(await res.arrayBuffer())

  const uploadUrl = runConvex('migrate:uploadUrl')
  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: buffer,
  })
  if (!up.ok) throw new Error(`העלאה נכשלה (${up.status}): ${(await up.text()).slice(0, 200)}`)
  const { storageId } = await up.json()
  return { legacy_id: item.legacy_id, storage_id: storageId, bytes: buffer.length }
}

async function worker(queue) {
  while (queue.length) {
    const item = queue.shift()
    try {
      const r = await migrateOne(item)
      results.push({ legacy_id: r.legacy_id, storage_id: r.storage_id })
      done++
      if (done % 10 === 0) console.log(`  הועברו ${done}/${pending.length}`)
    } catch (err) {
      failures.push({ legacy_id: item.legacy_id, url: item.url, error: String(err.message ?? err) })
    }
  }
}

const queue = [...pending]
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)))

console.log(`הועלו ${results.length}, נכשלו ${failures.length}`)

// קישור הקבצים לרשומות התמונות, באצוות
for (let i = 0; i < results.length; i += 40) {
  const chunk = results.slice(i, i + 40)
  const res = runConvex('migrate:attachStorage', { items: chunk })
  console.log(`  קושרו ${res.updated}`)
}

if (failures.length) {
  console.log('\nכשלונות:')
  for (const f of failures.slice(0, 20)) console.log(' ', f.legacy_id, f.error)
}

console.log('\n— סיכום —')
console.log(runConvex('migrate:stats'))
