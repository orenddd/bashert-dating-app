// ללא הקובץ הזה ctx.auth.getUserIdentity() תמיד יחזיר null
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: 'convex',
    },
  ],
}
