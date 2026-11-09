"use client"

import type { WorkspaceMemberPermissions } from "@chatbotx.io/database/partials"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@chatbotx.io/ui/components/ui/sidebar"
import {
  AtomIcon,
  ChevronsRight,
  HouseIcon,
  LightbulbIcon,
  type LucideIcon,
  MegaphoneIcon,
  MessageCircleMoreIcon,
  PhoneCallIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  SquareKanbanIcon,
  UsersIcon,
  WebhookIcon,
  WorkflowIcon,
  WrenchIcon,
} from "lucide-react"

import Link from "next/link"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "react"
import { BrandIcon } from "@/components/brand-icon"
import { NavHelp } from "@/components/nav-help"
import { NavMain } from "@/components/nav-main"
import { NavUsage, type QuotaSummary } from "@/components/nav-usage"
import { NavUser } from "@/components/nav-user"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import type { WorkspaceResource } from "@/features/workspaces/schema/resource"
import { authClient } from "@/lib/auth/auth-client"
import {
  hasContactsAccess,
  hasWorkspacePermission,
  PERMISSION_NAV,
  type WorkspacePermissionKey,
} from "@/lib/auth/permission-routes"

type NavGroupKey = "top" | "leads" | "automations" | "account"

// CaveChat: grupos do menu na ordem da Gaio (o primeiro não tem título)
const NAV_GROUPS: { key: NavGroupKey; label?: string }[] = [
  { key: "top" },
  { key: "leads", label: "Leads" },
  { key: "automations", label: "Automações" },
  { key: "account", label: "Conta" },
]

type SidebarNavItem = {
  title: string
  url: string
  icon: LucideIcon
  permission: WorkspacePermissionKey
  /** CaveChat: grupo do menu, no jeito da Gaio */
  group: NavGroupKey
  /** Only present for items with an extra visibility rule beyond the
   * permission check below — computed once in the workspace layout via
   * `resolveWorkspaceRealtimeGates`. */
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
  /** Gates the Calls nav item: call-history permission AND a connected
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

  const data = {
    user: {
      name: session?.user.name ?? "",
      email: session?.user.email ?? "",
      avatar: session?.user.image ?? "",
    },
    navMain: [
      {
        title: "Início",
        url: `/space/${workspaceId}/dashboard`,
        icon: HouseIcon,
        permission: PERMISSION_NAV.dashboard,
        group: "top",
      },
      {
        title: "Assistente IA",
        url: `/space/${workspaceId}/ai-agents`,
        icon: SparklesIcon,
        permission: PERMISSION_NAV.flows,
        group: "top",
      },
      {
        title: "Live Chat",
        url: `/space/${workspaceId}/inbox`,
        icon: MessageCircleMoreIcon,
        permission: PERMISSION_NAV.contacts,
        group: "leads",
      },
      {
        title: "Contatos",
        url: `/space/${workspaceId}/contacts`,
        icon: UsersIcon,
        permission: PERMISSION_NAV.contacts,
        group: "leads",
      },
      {
        title: "Funil de vendas",
        url: `/space/${workspaceId}/pipelines`,
        icon: SquareKanbanIcon,
        permission: PERMISSION_NAV.pipelines,
        group: "leads",
      },
      {
        title: "Campanhas",
        url: `/space/${workspaceId}/broadcasts`,
        icon: MegaphoneIcon,
        permission: PERMISSION_NAV.broadcasts,
        group: "leads",
      },
      {
        title: "Ligações",
        url: `/space/${workspaceId}/calls`,
        icon: PhoneCallIcon,
        permission: PERMISSION_NAV.contacts,
        group: "leads",
        visible: callHistoryNavVisible,
      },
      {
        title: "Fluxos",
        url: `/space/${workspaceId}/flows`,
        icon: WorkflowIcon,
        permission: PERMISSION_NAV.flows,
        group: "automations",
      },
      {
        title: "Respostas automáticas",
        url: `/space/${workspaceId}/automated-responses`,
        icon: AtomIcon,
        permission: "superAdmin",
        group: "automations",
      },
      {
        title: "Sequências",
        url: `/space/${workspaceId}/sequences`,
        icon: ChevronsRight,
        permission: PERMISSION_NAV.sequences,
        group: "automations",
      },
      {
        title: "Gatilhos",
        url: `/space/${workspaceId}/triggers`,
        icon: LightbulbIcon,
        permission: "superAdmin",
        group: "automations",
      },
      {
        title: "Ferramentas",
        url: `/space/${workspaceId}/tools`,
        icon: WrenchIcon,
        permission: PERMISSION_NAV.flows,
        group: "account",
      },
      {
        title: "Webhooks",
        url: `/space/${workspaceId}/webhooks`,
        icon: WebhookIcon,
        permission: "superAdmin",
        group: "account",
      },
      {
        title: "Configurações",
        url: `/space/${workspaceId}/settings/general`,
        icon: SlidersHorizontalIcon,
        permission: "superAdmin",
        group: "account",
      },
    ] satisfies SidebarNavItem[],
  }

  const isNavItemVisible = (item: SidebarNavItem): boolean => {
    // `visible` overrides the default single-permission gate below for an
    // item whose rule isn't a plain permission flag (Calls, see
    // `callHistoryNavVisible`).
    if (item.visible !== undefined) {
      return item.visible
    }
    // Items gated on the `contacts` flag (Contacts, Inbox) use the shared
    // contacts-access rule, which also admits assigned-only members.
    if (item.permission === PERMISSION_NAV.contacts) {
      return hasContactsAccess(permissions)
    }
    return hasWorkspacePermission(permissions, item.permission)
  }

  const navMain = data.navMain.filter(isNavItemVisible).map((item) => ({
    ...item,
    disabled:
      scheduledForDeletion && !item.url.endsWith(SETTINGS_GENERAL_URL_SEGMENT),
  }))

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
        {NAV_GROUPS.map((group) => {
          const groupItems = navMain.filter((item) => item.group === group.key)
          return groupItems.length > 0 ? (
            <NavMain
              disabledTooltip={t("workspace.deletion.navDisabledTooltip")}
              items={groupItems}
              key={group.key}
              label={group.label}
            />
          ) : null
        })}
      </SidebarContent>
      <SidebarFooter>
        <NavUsage
          metrics={quota.metrics}
          planStatus={quota.planStatus}
          trialEndsAt={quota.trialEndsAt}
        />
        <NavUser
          canAccessManage={canAccessManage}
          isSuperAdmin={isSuperAdmin}
          planName={quota.planName}
          user={data.user}
        />
        <NavHelp />
      </SidebarFooter>
    </Sidebar>
  )
}
