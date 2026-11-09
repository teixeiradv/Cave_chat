import type { WorkspaceMemberPermissions } from "@chatbotx.io/database/partials"
import {
  hasContactsAccess,
  hasWorkspacePermission,
  PERMISSION_NAV,
  type WorkspacePermissionKey,
} from "@/lib/auth/permission-routes"

// CaveChat: estrutura igual à da Gaio. O menu lateral tem só as seções
// (Geral, Assistente, Automações, Leads, Comunidade); as páginas de cada
// seção aparecem como abas no cabeçalho da página.

export type WorkspaceSectionKey =
  | "general"
  | "assistant"
  | "leads"
  | "automations"
  | "community"
  | "settings"

export type SectionTab = {
  title: string
  segment: string
  permission: WorkspacePermissionKey
  /** Ligações: só aparece com canal de ligação conectado */
  callsOnly?: boolean
}

export const SECTION_TABS: Record<"leads" | "automations", SectionTab[]> = {
  leads: [
    { title: "Live Chat", segment: "inbox", permission: PERMISSION_NAV.contacts },
    { title: "Contatos", segment: "contacts", permission: PERMISSION_NAV.contacts },
    {
      title: "Funil de vendas",
      segment: "pipelines",
      permission: PERMISSION_NAV.pipelines,
    },
    {
      title: "Campanhas",
      segment: "broadcasts",
      permission: PERMISSION_NAV.broadcasts,
    },
    {
      title: "Ligações",
      segment: "calls",
      permission: PERMISSION_NAV.contacts,
      callsOnly: true,
    },
  ],
  automations: [
    { title: "Fluxos", segment: "flows", permission: PERMISSION_NAV.flows },
    {
      title: "Respostas automáticas",
      segment: "automated-responses",
      permission: "superAdmin",
    },
    {
      title: "Sequências",
      segment: "sequences",
      permission: PERMISSION_NAV.sequences,
    },
    { title: "Gatilhos", segment: "triggers", permission: "superAdmin" },
    { title: "Webhooks", segment: "webhooks", permission: "superAdmin" },
  ],
}

export const SECTION_TITLES: Record<WorkspaceSectionKey, string> = {
  general: "Geral",
  assistant: "Assistente",
  leads: "Leads",
  automations: "Automações",
  community: "Comunidade",
  settings: "Configurações",
}

const SEGMENT_SECTION: Record<string, WorkspaceSectionKey> = {
  dashboard: "general",
  "ai-agents": "assistant",
  "ai-files": "assistant",
  "ai-functions": "assistant",
  "ai-mcp-servers": "assistant",
  inbox: "leads",
  contacts: "leads",
  pipelines: "leads",
  broadcasts: "leads",
  calls: "leads",
  flows: "automations",
  "automated-responses": "automations",
  sequences: "automations",
  triggers: "automations",
  webhooks: "automations",
  tools: "community",
  settings: "settings",
  "custom-fields": "settings",
  tags: "settings",
}

export const SETTINGS_PAGE_TITLES: Record<string, string> = {
  general: "Geral",
  admins: "Membros da equipe",
  channels: "Canais",
  "inbox-teams": "Inbox",
  "custom-fields": "Campos personalizados",
  tags: "Etiquetas",
  "user-persistent-menus": "Menus persistentes",
  integrations: "Integrações",
}

/** Lê /space/<id>/<segment>/<sub> do caminho atual. */
export function parseWorkspacePath(pathname: string | null) {
  const parts = (pathname ?? "").split("/")
  if (parts[1] !== "space" || !parts[3]) {
    return null
  }
  const segment = parts[3]
  return {
    segment,
    sub: parts[4] ?? "",
    section: SEGMENT_SECTION[segment] ?? null,
  }
}

export function isSectionTabVisible(
  tab: SectionTab,
  permissions: WorkspaceMemberPermissions,
  callHistoryNavVisible: boolean,
): boolean {
  if (tab.callsOnly) {
    return callHistoryNavVisible
  }
  // Mesmo critério do menu antigo: itens com a permissão "contacts" usam a
  // regra compartilhada, que também aceita membros só com contatos atribuídos.
  if (tab.permission === PERMISSION_NAV.contacts) {
    return hasContactsAccess(permissions)
  }
  return hasWorkspacePermission(permissions, tab.permission)
}

export function getVisibleSectionTabs(
  section: "leads" | "automations",
  permissions: WorkspaceMemberPermissions,
  callHistoryNavVisible: boolean,
): SectionTab[] {
  return SECTION_TABS[section].filter((tab) =>
    isSectionTabVisible(tab, permissions, callHistoryNavVisible),
  )
}
