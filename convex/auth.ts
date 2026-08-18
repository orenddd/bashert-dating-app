import { convexAuth } from '@convex-dev/auth/server'
import { Password } from '@convex-dev/auth/providers/Password'
import bcrypt from 'bcryptjs'
import type { MutationCtx } from './_generated/server'
import { emptyProfile } from './profileDefaults'

// Supabase גיבב סיסמאות ב-bcrypt ($2a$10$...). כדי שהמשתמשים הקיימים
// ימשיכו להתחבר עם אותה סיסמה, אנחנו מחליפים את Scrypt (ברירת המחדל של
// Convex Auth) ב-bcrypt באותו cost — כך ה-hash-ים שיובאו מאומתים כמו שהם.
const BCRYPT_ROUNDS = 10

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? '').trim().toLowerCase()
        const name = [params.first_name, params.last_name].filter(Boolean).join(' ').trim()
        return {
          email,
          ...(name ? { name } : {}),
          created_at: new Date().toISOString(),
        }
      },
      // גרסאות ה-Sync בלבד: ה-API האסינכרוני של bcryptjs מתזמן עבודה עם
      // setTimeout, שאסור בתוך mutation של Convex — ושם רצה בדיקת הסיסמה.
      crypto: {
        async hashSecret(secret: string) {
          return bcrypt.hashSync(secret, BCRYPT_ROUNDS)
        },
        async verifySecret(secret: string, hash: string) {
          return bcrypt.compareSync(secret, hash)
        },
      },
    }),
  ],
  callbacks: {
    // יצירת שורת פרופיל ריקה מיד עם יצירת המשתמש (אידמפוטנטי)
    async afterUserCreatedOrUpdated(ctx, { userId }) {
      const mctx = ctx as unknown as MutationCtx
      const existing = await mctx.db
        .query('profiles')
        .withIndex('by_user_id', (q) => q.eq('user_id', userId))
        .unique()
      if (existing) return

      const user = await mctx.db.get('users', userId)
      const name = (user?.name ?? '').trim()
      const [first = '', ...rest] = name ? name.split(' ') : []
      await mctx.db.insert('profiles', {
        ...emptyProfile(userId),
        first_name: first,
        last_name: rest.join(' '),
        display_name: name,
      })
    },
  },
})
