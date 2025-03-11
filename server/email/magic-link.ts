'use server'

import { sendEmail } from './send-email'

type MagicLinkParams = {
  email: string
  token: string
  url: string
}

export async function sendMagicLinkEmail({
  email,
  token,
  url,
}: MagicLinkParams) {
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Magic Link',
      text: `Click here to login: ${url}`,
    })

    return result
  } catch (error) {
    console.error('Failed to send magic link email:', error)
    return { success: false, error }
  }
}
