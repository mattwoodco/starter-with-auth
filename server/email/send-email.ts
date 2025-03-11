'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export type EmailPayload = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(payload: EmailPayload) {
  const { to, subject, text, html } = payload

  try {
    const data = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'no-reply@example.com',
      to,
      subject,
      text,
      html: html || text,
    })

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
