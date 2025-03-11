import { auth } from '@/server/auth'
import { headers } from 'next/headers'
import { LoginButton } from '../common/login-button'
import { LogoutButton } from '../common/logout-button'
import { MagicLink } from '../common/magic-link'

export async function SessionProvider() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session ? (
    <div className="flex items-center gap-4">
      <h1>Welcome {session.user.name}</h1>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center gap-2">
        <LoginButton />
        <span className="text-muted-foreground">or</span>
      </div>
      <MagicLink />
    </div>
  )
}
