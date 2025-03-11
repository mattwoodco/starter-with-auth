'use client'

import { useSession } from '@/lib/api'
import { sendEmail } from '@/server/email/send-email'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'

export const SendEmailButton = () => {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()

  const handleSendEmail = async () => {
    if (!session?.user?.email) {
      toast.error('No user email found. Please log in.')
      return
    }

    setIsLoading(true)
    try {
      const result = await sendEmail({
        to: session.user.email,
        subject: 'Test Email',
        text: 'This is a test email',
      })

      if (result.success) {
        toast.success('Email sent successfully!')
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      toast.error('Failed to send email. Please try again.')
      console.error('Send email error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSendEmail} disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Email'}
    </Button>
  )
}
