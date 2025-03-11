import { auth } from '@/server/auth'
import { headers } from 'next/headers'
import { LoginButton } from '../common/login-button'
import { LogoutButton } from '../common/logout-button'

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
    <div>
      <LoginButton />
    </div>
  )
}
