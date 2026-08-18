import { ConvexReactClient } from 'convex/react'

// לקוח יחיד לכל האפליקציה — גם ה-Provider וגם קריאות ה-API ב-src/lib/api
// משתמשים בו, כדי שכולם יחלקו את אותו טוקן הזדהות.
export const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
