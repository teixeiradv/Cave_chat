"use client"

import type { WorkspaceMemberPermissions } from "@chatbotx.io/database/partials"
import { cn } from "@chatbotx.io/ui/lib/utils"
import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  getVisibleSectionTabs,
  parseWorkspacePath,
  SECTION_TITLES,
  SETTINGS_PAGE_TITLES,
} from "@/components/workspace-sections"

/**
 * CaveChat: barra de topo no jeito da Gaio — título da seção e, em Leads e
 * Automações, as abas das páginas da seção. Nas configurações mostra o
 * caminho "Configurações › <conta> › <página>". Fica fora do <main>, então
 * não mexe no padding nem na altura das páginas full-bleed (inbox).
 */
export function WorkspaceSectionHeader({
  workspaceId,
  workspaceName,
  permissions,
  callHistoryNavVisible,
  scheduledForDeletion = false,
}: {
  workspaceId: string
  workspaceName: string
  permissions: WorkspaceMemberPermissions
  callHistoryNavVisible: boolean
  scheduledForDeletion?: boolean
}) {
  const pathname = usePathname()
  const parsed = parseWorkspacePath(pathname)
  if (scheduledForDeletion || !parsed?.section) {
    return null
  }
  const { section, segment, sub } = parsed

  if (section === "settings") {
    const pageTitle =
      SETTINGS_PAGE_TITLES[segment === "settings" ? sub : segment] ?? null
    return (
      <div className="flex h-12 shrink-0 items-center border-b px-4 md:ps-10 md:pe-6">
        <nav
          aria-label="breadcrumb"
          className="flex min-w-0 items-center gap-1.5 text-sm"
        >
          <Link
            className="shrink-0 text-muted-foreground hover:text-foreground"
            href={`/space/${workspaceId}/settings/general`}
          >
            Configurações
          </Link>
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">
            {workspaceName}
          </span>
          {pageTitle && (
            <>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate font-medium text-foreground">
                {pageTitle}
              </span>
            </>
          )}
        </nav>
      </div>
    )
  }

  const tabs =
    section === "leads" || section === "automations"
      ? getVisibleSectionTabs(section, permissions, callHistoryNavVisible)
      : []

  return (
    <div className="flex h-12 shrink-0 items-center gap-4 overflow-x-auto border-b px-4 md:ps-10 md:pe-6">
      <div className="shrink-0 font-semibold text-base">
        {SECTION_TITLES[section]}
      </div>
      {tabs.length > 0 && (
        <nav aria-label={SECTION_TITLES[section]} className="flex items-center gap-1">
          {tabs.map((tab) => {
            const href = `/space/${workspaceId}/${tab.segment}`
            const isActive = segment === tab.segment
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent",
                  isActive
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground",
                )}
                href={href}
                key={tab.segment}
              >
                {tab.title}
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
