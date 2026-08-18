// אימות זרימת ההודעות המלאה: בקשה → אישור → שיחה → הודעות
import { ConvexHttpClient } from 'convex/browser'
import { execFileSync } from 'node:child_process'
import { loadEnv } from './lib.mjs'

const env = loadEnv()
const { api } = await import('../../convex/_generated/api.js')
const URL_ = env.NEXT_PUBLIC_CONVEX_URL
const USER1 = { email: 'convex-check@example.com', password: 'TestPassword123' }
const USER2 = { email: `convex-check2-${Date.now()}@example.com`, password: 'TestPassword123' }

const anon = new ConvexHttpClient(URL_)
const signIn = async (params) => (await anon.action(api.auth.signIn, { provider: 'password', params })).tokens.token

const token1 = await signIn({ ...USER1, flow: 'signIn' })
const token2 = await signIn({ ...USER2, flow: 'signUp', first_name: 'בדיקה', last_name: 'שנייה' })
console.log('1. שני משתמשים מחוברים')

const c1 = new ConvexHttpClient(URL_); c1.setAuth(token1)
const c2 = new ConvexHttpClient(URL_); c2.setAuth(token2)

const me1 = await c1.query(api.profiles.me, {})
const me2 = await c2.query(api.profiles.me, {})
console.log('2. פרופילים נוצרו:', !!me1?.profile, !!me2?.profile)

console.log('3. משתמש 2 שולח בקשת הודעה למשתמש 1:',
  await c2.mutation(api.messages.sendRequest, { toUserId: me1.id, initialMessage: 'שלום, בדיקת שיחה' }))

const received = await c1.query(api.messages.requestsReceived, {})
console.log('4. הבקשה מופיעה אצל משתמש 1:', received.length, received[0]?.req.initial_message)

const conv = await c1.mutation(api.messages.acceptRequest, { requestId: received[0].req.id })
console.log('5. שיחה נוצרה:', !!conv, conv?.last_message_preview)

await c1.mutation(api.messages.send, { conversationId: conv.id, content: 'תשובה מבדיקה' })
const msgs = await c2.query(api.messages.list, { conversationId: conv.id })
console.log('6. הודעות בשיחה:', msgs.map(m => m.content))

const convs2 = await c2.query(api.messages.conversations, {})
console.log('7. השיחה ברשימת משתמש 2:', convs2.length, 'לא נקראו:', convs2[0]?.unread)

const ok = msgs.length === 2 && convs2.length === 1
console.log(ok ? '\n✔ זרימת ההודעות תקינה' : '\n✖ תקלה בזרימת ההודעות')
if (!ok) process.exitCode = 1

console.log('\nניקוי משתמשי הבדיקה...')
for (const email of [USER1.email, USER2.email]) {
  const out = execFileSync('npx', ['convex', 'run', 'migrate:devDeleteUserByEmail', JSON.stringify({ email })], { encoding: 'utf8' })
  console.log(' ', email, out.trim().replace(/\s+/g, ' '))
}
