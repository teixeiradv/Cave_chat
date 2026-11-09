import { isWorkspaceScheduledForDeletion } from "@chatbotx.io/business"
import type { ReactNode } from "react"
import { resolveGuardedWorkspaceId } from "@/lib/auth/require-workspace-permission"
import { getCurrentUserAndTargetWorkspace } from "@/lib/auth/utils"
import { SettingsTab } from "./tab"

type LayoutSettingProps = {
  children: ReactNode
  params: Promise<{ workspaceId: string }>
}

export default async function SettingLayout({
  children,
  params,
}: LayoutSettingProps) {
  const workspaceId = await resolveGuardedWorkspaceId(params, "superAdmin")
  const result = await getCurrentUserAndTargetWorkspace(workspaceId)
  const scheduledForDeletion = result?.targetWorkspace
    ? isWorkspaceScheduledForDeletion(result.targetWorkspace)
    : false

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <SettingsTab scheduledForDeletion={scheduledForDeletion} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
