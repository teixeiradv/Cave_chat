"use client"
import { cn } from "@chatbotx.io/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useWorkspaceId } from "@/hooks/routing"

const GENERAL_TAB_VALUE = "general"

type SettingsLink = { label: string; path: string; inSettings: boolean }

// CaveChat: configurações agrupadas como na Gaio (Principal, Leads, Chat, Integrações).
// Os itens "inSettings" ficam em /settings/...; os outros são páginas do workspace.
const SETTINGS_GROUPS: { label: string; links: SettingsLink[] }[] = [
  {
    label: "Principal",
    links: [
      { label: "Geral", path: "general", inSettings: true },
      { label: "Membros da equipe", path: "admins", inSettings: true },
      { label: "Canais", path: "channels", inSettings: true },
    ],
  },
  {
    label: "Leads",
    links: [
      { label: "Inbox", path: "inbox-teams", inSettings: true },
      { label: "Campos personalizados", path: "custom-fields", inSettings: false },
      { label: "Etiquetas", path: "tags", inSettings: false },
    ],
  },
  {
    label: "Chat",
    links: [
      { label: "Menus persistentes", path: "user-persistent-menus", inSettings: true },
    ],
  },
  {
    label: "Integrações",
    links: [
      { label: "Integrações", path: "integrations", inSettings: true },
      { label: "Webhooks", path: "webhooks", inSettings: false },
    ],
  },
]

export function SettingsTab({
  scheduledForDeletion = false,
}: {
  scheduledForDeletion?: boolean
}) {
  const t = useTranslations()
  const pathname = usePathname()
  const workspaceId = useWorkspaceId()

  return (
    <nav
      aria-label="Configurações"
      className="w-full shrink-0 md:w-56"
    >
      <div className="px-3 pb-2">
        <div className="font-semibold text-base">Configurações da conta</div>
        <div className="text-muted-foreground text-xs">
          Gerencie suas configurações de conta
        </div>
      </div>
      {SETTINGS_GROUPS.map((group) => (
        <div className="pt-3" key={group.label}>
          <div className="px-3 pb-1 font-medium text-muted-foreground text-xs">
            {group.label}
          </div>
          {group.links.map((link) => {
            const href = link.inSettings
              ? `/space/${workspaceId}/settings/${link.path}`
              : `/space/${workspaceId}/${link.path}`
            const isActive = pathname.startsWith(href)
            const disabled =
              scheduledForDeletion && link.path !== GENERAL_TAB_VALUE
            return disabled ? (
              <span
                className="block cursor-not-allowed rounded-md px-3 py-2 text-muted-foreground text-sm opacity-50"
                key={link.path}
                title={t("workspace.deletion.navDisabledTooltip")}
              >
                {link.label}
              </span>
            ) : (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "block rounded-md border-l-2 px-3 py-2 text-sm transition-colors hover:bg-accent",
                  isActive
                    ? "border-primary bg-accent font-medium text-foreground"
                    : "border-transparent text-muted-foreground",
                )}
                href={href}
                key={link.path}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
