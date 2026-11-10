import { UiProvider } from "@chatbotx.io/ui"
import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale } from "next-intl/server"
import type { ReactNode } from "react"
import { isDefaultBrandAsset } from "@/components/brand-logo"
import { DataTableLabelsBridge } from "@/components/data-table-labels-bridge"
import { FormOptionalLabelBridge } from "@/components/form-optional-label-bridge"
import { PublicEnvScript } from "@/components/public-env-script"
import { SupportChatScript } from "@/components/support-chat-script"
import { TimezoneSync } from "@/components/timezone-sync"
import { env } from "@/env"
import { TemplateInstallIntentGuard } from "@/features/templates/components/template-install-intent-guard"
import { TenantProvider } from "@/features/tenant"
import { getTenantSettings } from "@/features/tenant/utils"
import { getDirection } from "@/i18n/direction"
import { getDomainFromHeader } from "@/lib/domain"
import { QueryProvider } from "@/lib/query/query-provider"
import { getUserTimezone } from "@/lib/timezone"
import "./globals.css"
import "./themes.css"
import { DirectionProvider } from "@chatbotx.io/ui/components/ui/direction"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // `cover` lets the page paint under the notch/home indicator so
  // `env(safe-area-inset-*)` reports real values. Fixed mobile chrome
  // (the sidebar's edge handle, the inbox composer) relies on those insets.
  viewportFit: "cover",
  themeColor: "#0a0a0b",
}

export async function generateMetadata(): Promise<Metadata> {
  const { name, faviconUrl, appUrl } = await getTenantSettings()
  // Built-in CaveChat icons ship in several sizes; a tenant override (white
  // label) only has the single favicon URL it uploaded.
  const builtIn = isDefaultBrandAsset(faviconUrl)
  const description = `${name} — automações e atendimento no Instagram, WhatsApp e Messenger`

  return {
    metadataBase: new URL(appUrl),
    title: name,
    description,
    applicationName: name,
    icons: builtIn
      ? {
          icon: [
            { url: "/brand/v2/favicon.ico", sizes: "any" },
            {
              url: "/brand/v2/favicon-32.png",
              sizes: "32x32",
              type: "image/png",
            },
            {
              url: "/brand/v2/favicon-96.png",
              sizes: "96x96",
              type: "image/png",
            },
          ],
          apple: [
            {
              url: "/brand/v2/apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        }
      : { icon: faviconUrl, apple: faviconUrl },
    manifest: "/brand/v2/site.webmanifest",
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description,
      images: [
        {
          url: "/brand/v2/og-image.png",
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: ["/brand/v2/og-image.png"],
    },
  }
}

type Props = {
  children: ReactNode
}

export default async function RootLayout({ children }: Props) {
  const locale = await getLocale()
  const dir = getDirection(locale)
  const tenantSettings = await getTenantSettings()
  const timezone = await getUserTimezone()
  const domain = await getDomainFromHeader()
  const isBuilderDomain =
    domain === new URL(env.NEXT_PUBLIC_BUILDER_URL).hostname
  const pancakeChatPageId = env.NEXT_PUBLIC_PANCAKE_CHAT_PAGE_ID

  return (
    <html dir={dir} lang={locale} suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <PublicEnvScript />
        {isBuilderDomain && pancakeChatPageId && (
          <SupportChatScript pageId={pancakeChatPageId} />
        )}
      </head>
      <body
        className={
          tenantSettings.theme
            ? `theme-${tenantSettings.theme.toLowerCase()}`
            : undefined
        }
        suppressHydrationWarning
      >
        <TenantProvider settings={tenantSettings}>
          <DirectionProvider direction={dir}>
            <UiProvider>
              <NextIntlClientProvider>
                <FormOptionalLabelBridge>
                  <DataTableLabelsBridge>
                    <QueryProvider>
                      <TimezoneSync timezone={timezone} />
                      <TemplateInstallIntentGuard />
                      {children}
                    </QueryProvider>
                  </DataTableLabelsBridge>
                </FormOptionalLabelBridge>
              </NextIntlClientProvider>
            </UiProvider>
          </DirectionProvider>
        </TenantProvider>
      </body>
    </html>
  )
}
