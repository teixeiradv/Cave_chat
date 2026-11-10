import Link from "next/link"
import type { ReactNode } from "react"
import { BrandLogo } from "@/components/brand-logo"

/**
 * Public legal pages (privacy policy, terms and data deletion). Meta requires
 * these URLs in the app settings before Instagram / Messenger / WhatsApp can
 * go live, so they live on the CaveChat domain and need no sign-in
 * (`/legal` is in `PUBLIC_ROUTES`).
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link aria-label="CaveChat" href="/">
            <BrandLogo size="sm" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <article className="flex flex-col gap-4 text-muted-foreground text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_h1]:font-semibold [&_h1]:text-2xl [&_h1]:text-foreground [&_h2]:mt-4 [&_h2]:font-semibold [&_h2]:text-base [&_h2]:text-foreground [&_li]:ms-5 [&_li]:list-disc">
          {children}
        </article>
        <nav className="mt-10 flex flex-wrap gap-4 border-t pt-6 text-muted-foreground text-xs">
          <Link className="hover:text-foreground" href="/legal/privacidade">
            Política de privacidade
          </Link>
          <Link className="hover:text-foreground" href="/legal/termos">
            Termos de uso
          </Link>
          <Link className="hover:text-foreground" href="/legal/exclusao-de-dados">
            Exclusão de dados
          </Link>
        </nav>
      </main>
    </div>
  )
}
