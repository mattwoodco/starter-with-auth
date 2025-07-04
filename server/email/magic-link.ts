'use server';

import { sendEmail } from './send-email';

export type MagicLinkParams = {
  email: string;
  token: string;
  url: string;
};

export async function sendMagicLinkEmail({
  email,
  url,
}: Omit<MagicLinkParams, 'token'>) {
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Magic Link',
      text: `Click here to login: ${url}`,
    });

    return result;
  } catch (error) {
    return { success: false, error };
  }
}
