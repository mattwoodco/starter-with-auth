import { Header } from '@/components/common/header'
import { Message } from '@/components/common/message'
import { siteConfig } from '@/config/site'

export default async () => {
  return (
    <div className="flex h-screen w-screen flex-col p-6">
      <Header />
      <section className="flex max-w-sm animate-delay-200 animate-fade-up flex-col gap-3">
        <p className="text-foreground/85 text-sm/5">{siteConfig.description}</p>
        <Message />
      </section>
    </div>
  )
}
