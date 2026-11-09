import { redirect } from "next/navigation"
import { getCurrentUserAndAllLinkedWorkspaces } from "@/lib/auth/utils"

/**
 * CaveChat: URLs no formato da Gaio (/livechat, /workflows, /settings/account…)
 * levam para a página equivalente no primeiro workspace do usuário.
 */
export async function redirectToWorkspacePage(page: string): Promise<void> {
  const userAndWorkspaces = await getCurrentUserAndAllLinkedWorkspaces()
  if (!userAndWorkspaces) {
    redirect("/auth/sign-in")
  }
  const workspaceId =
    userAndWorkspaces.allWorkspaces[0]?.id ??
    userAndWorkspaces.allWorkspaceMembers[0]?.workspaceId
  if (!workspaceId) {
    redirect("/")
  }
  redirect(`/space/${workspaceId}/${page}`)
}
