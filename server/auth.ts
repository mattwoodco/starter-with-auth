import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink } from 'better-auth/plugins/magic-link'
import { db } from './db'
import { sendMagicLinkEmail } from './email/magic-link'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async (params) => {
        await sendMagicLinkEmail(params)
      },
    }),
    nextCookies(),
  ],
})
