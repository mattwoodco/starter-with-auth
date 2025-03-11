'use client'

import { api } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export const Message = () => {
  const { data, status } = useQuery({
    queryKey: ['hello'],
    queryFn: async () => {
      const res = await api.hello.$get()
      return res.json()
    },
  })

  return (
    <div>
      <span className="text-xs">Response: {status}</span>
      <pre className="font-mono text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
