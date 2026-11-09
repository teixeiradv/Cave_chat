"use client"

import type { WorkspaceMemberPermissions } from "@chatbotx.io/database/partials"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@chatbotx.io/ui/components/ui/sidebar"
import {
  GlobeIcon,
  HouseIcon,
  type LucideIcon,
  SparklesIcon,
  UserIcon,
  WorkflowIcon,
} from "lucide-react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { BrandIcon } from "@/components/brand-icon"
import { NavHelp } from "@/components/nav-help"
import { NavMain } from "@/components/nav-main"
import { NavUsage, type QuotaSummary } from "@/components/nav-usage"
import { NavUser } from "@/components/nav-user"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import {
  getVisibleSectionTabs,
  parseWorkspacePath,
} from "@/components/workspace-sections"
import type { WorkspaceResource } from "@/features/workspaces/schema/resource"
import { authClient } from "@/lib/auth/auth-client"
import {
  hasWorkspacePermission,
  PERMISSION_NAV,
  type WorkspacePermissionKey,
} from "@/lib/auth/permission-routes"

// CaveChat: menu lateral igual ao da Gaio — só as 5 seções. As páginas de
// Leads e Automações viram abas no cabeçalho (workspace-section-header.tsx).
type SidebarNavItem = {
  title: string
  url: string
  icon: LucideIcon
  permission: WorkspacePermissionKey
  badge?: string
  isActive?: boolean
  /** Quando presente, substitui a checagem de permissão. */
  visible?: boolean
}

const SETTINGS_GENERAL_URL_SEGMENT = "/settings/general"

export function AppSidebar({
  workspaceId,
  allWorkspaces,
  callHistoryNavVisible,
  canAccessManage,
  isSuperAdmin,
  permissions,
  quota,
  scheduledForDeletion = false,
  ...props
}: ComponentProps<typeof Sidebar> & {
  workspaceId: string
  allWorkspaces: WorkspaceResource[]
  /** Gates the Calls tab: call-history permission AND a connected
   * call-capable channel. */
  callHistoryNavVisible: boolean
  canAccessManage?: boolean
  isSuperAdmin?: boolean
  // Runtime may be a partial object (the jsonb column defaults to `{}`);
  // `hasWorkspacePermission` fails closed on any missing flag.
  permissions: WorkspaceMemberPermissions
  quota: QuotaSummary
  scheduledForDeletion?: boolean
}) {
  const t = useTranslations()
  const { data: session } = authClient.useSession()
  const pathname = usePathname()
  const section = parseWorkspacePath(pathname)?.section ?? null

  const user = {
    name: session?.user.name ?? "",
    email: session?.user.email ?? "",
    avatar: session?.user.image ?? "",
  }

  const leadsTabs = getVisibleSectionTabs(
    "leads",
    permissions,
    callHistoryNavVisible,
  )
  const automationTabs = getVisibleSectionTabs(
    "automations",
    permissions,
    callHistoryNavVisible,
  )

  const items: SidebarNavItem[] = [
    {
      title: "Geral",
      url: `/space/${workspaceId}/dashboard`,
      icon: HouseIcon,
      permission: PERMISSION_NAV.dashboard,
      isActive: section === "general",
    },
    {
      title: "Assistente",
      url: `/space/${workspaceId}/ai-agents`,
      icon: SparklesIcon,
      permission: PERMISSION_NAV.flows,
      badge: "Beta",
      isActive: section === "assistant",
    },
    {
      title: "Automações",
      url: `/space/${workspaceId}/${automationTabs[0]?.segment ?? "flows"}`,
      icon: WorkflowIcon,
      permission: PERMISSION_NAV.flows,
      visible: automationTabs.length > 0,
      isActive: section === "automations",
    },
    {
      title: "Leads",
      url: `/space/${workspaceId}/${leadsTabs[0]?.segment ?? "inbox"}`,
      icon: UserIcon,
      permission: PERMISSION_NAV.contacts,
      visible: leadsTabs.length > 0,
      isActive: section === "leads",
    },
    {
      title: "Comunidade",
      url: `/space/${workspaceId}/tools`,
      icon: GlobeIcon,
      permission: PERMISSION_NAV.flows,
      isActive: section === "community",
    },
  ]

  const isNavItemVisible = (item: SidebarNavItem): boolean => {
    if (item.visible !== undefined) {
      return item.visible
    }
    return hasWorkspacePermission(permissions, item.permission)
  }

  const navMain = items.filter(isNavItemVisible).map((item) => ({
    ...item,
    disabled:
      scheduledForDeletion && !item.url.endsWith(SETTINGS_GENERAL_URL_SEGMENT),
  }))

  // "Configurações da conta" fica no menu do avatar, como na Gaio
  // (antes era um item do menu lateral, só para superAdmin).
  const settingsUrl = hasWorkspacePermission(permissions, "superAdmin")
    ? `/space/${workspaceId}${SETTINGS_GENERAL_URL_SEGMENT}`
    : undefined

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-0 px-0 py-0">
        <Link
          className="flex h-12 items-center justify-center border-b"
          href="/"
        >
          <BrandIcon alt="Brand" />
        </Link>
        <div className="border-b px-1">
          <WorkspaceSwitcher workspaces={allWorkspaces} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          disabledTooltip={t("workspace.deletion.navDisabledTooltip")}
          items={navMain}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUsage
          metrics={quota.metrics}
          planStatus={quota.planStatus}
          trialEndsAt={quota.trialEndsAt}
        />
        <NavHelp />
        <NavUser
          canAccessManage={canAccessManage}
          isSuperAdmin={isSuperAdmin}
          planName={quota.planName}
          settingsUrl={settingsUrl}
          user={user}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
