'use client'

import { siteConfig } from '@/config/site'
import { useSession } from '@/lib/api'
import { LoginButton } from './login-button'
import { LogoutButton } from './logout-button'
import { MagicLink } from './magic-link'
import { ModeToggle } from './mode-toggle'

export const Header = () => {
  const { data: session } = useSession()

  return (
    <header className="flex w-full items-center justify-between">
      <h1 className="font-bold text-2xl">{siteConfig.title}</h1>
      <div className="flex items-center gap-2">
        <ModeToggle />
        {session ? (
          <LogoutButton />
        ) : (
          <div className="flex items-center gap-2">
            <LoginButton />
            <MagicLink />
          </div>
        )}
      </div>
    </header>
  )
}
