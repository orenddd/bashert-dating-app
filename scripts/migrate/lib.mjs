// כלי עזר משותפים לסקריפטי ההגירה מ-Supabase ל-Convex
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const ROOT = process.cwd()
export const DATA_DIR = path.join(ROOT, 'migration-data')

export function loadEnv(file = '.env.local') {
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf8')
  return Object.fromEntries(
    raw.split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#')).map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
  )
}

export function projectRef() {
  return fs.readFileSync(path.join(ROOT, 'supabase/.temp/project-ref'), 'utf8').trim()
}

export function supabaseAccessToken() {
  return fs.readFileSync(path.join(os.homedir(), '.supabase/access-token'), 'utf8').trim()
}

// הרצת SQL דרך ה-Management API (מאפשר גישה לסכמת auth שאינה חשופה ב-PostgREST)
export async function runSql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef()}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text.slice(0, 500)}`)
  return JSON.parse(text)
}

export function writeJson(name, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2))
  return path.join(DATA_DIR, name)
}

export function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8'))
}

// יעד ההרצה של ה-CLI: ברירת מחדל dev, ועם CONVEX_ENV=prod — הפרודקשן
export function convexArgs() {
  return process.env.CONVEX_ENV === 'prod' ? ['--prod'] : []
}
