import { Message } from '@/components/common/message'
import { ModeToggle } from '@/components/common/mode-toggle'
import { SessionProvider } from '@/components/providers/session-provider'
import { siteConfig } from '@/config/site'

export default async () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center p-6">
      <section className="flex max-w-sm animate-delay-200 animate-fade-up flex-col gap-3">
        <div className="flex items-center justify-center">
          <ModeToggle />
        </div>
        <h1 className="font-extrabold text-xl tracking-tight md:text-3xl">
          Next.js Starter
        </h1>
        <SessionProvider />
        <p className="text-foreground/85 text-sm/5">{siteConfig.description}</p>
        <Message />
      </section>
    </div>
  )
}
