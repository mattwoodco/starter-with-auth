import { Header } from "@/components/common/header";
import { Message } from "@/components/common/message";
import { ModeToggle } from "@/components/common/mode-toggle";
import { siteConfig } from "@/config/site";

export default async () => {
  return (
    <div className="flex h-screen w-screen flex-col p-6">
      <Header />
      <section className="mx-auto flex max-w-sm flex-1 animate-delay-200 animate-fade-up flex-col gap-3">
        <p className="text-foreground/85 text-sm/5">{siteConfig.description}</p>
        <Message />
      </section>
      <footer className="flex items-center justify-end">
        <ModeToggle />
      </footer>
    </div>
  );
};
