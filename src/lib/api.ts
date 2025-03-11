import type { ApiRoutes } from '@/server/main'
import { magicLinkClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { hc } from 'hono/client'

// hono rpc client
export const api = hc<ApiRoutes>('/').api

export const { signIn, signUp, useSession, signOut } = createAuthClient({
  baseURL: 'http://localhost:3000',
  plugins: [magicLinkClient()],
})
