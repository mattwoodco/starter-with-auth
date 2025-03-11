'use client'

import { signOut } from '@/lib/api'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'

export const LogoutButton = () => {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      window.location.reload()
    } catch (error) {
      toast.error('Failed to sign out. Please try again.')
      console.error('Sign out error:', error)
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSignOut} disabled={isLoading}>
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Logout'}
    </Button>
  )
}
