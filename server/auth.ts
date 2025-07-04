import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';
import { sendMagicLinkEmail, type MagicLinkParams } from './email/magic-link';

// const googleClientId = process.env.AUTH_GOOGLE_ID;
// const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

// if (!(googleClientId && googleClientSecret)) {
//   throw new Error(
//     'AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET environment variables are required'
//   );
// }

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  ...(process.env.RESEND_API_KEY && {
    magicLink: {
      sendMagicLink: async (params: Omit<MagicLinkParams, 'token'>) => {
        await sendMagicLinkEmail(params);
      },
    },
  }),
  plugins: [
    // socialProviders: {
    //   google: {
    //     clientId: googleClientId,
    //     clientSecret: googleClientSecret,
    //   },
    // },
    nextCookies(),
  ],
});
