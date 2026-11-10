import {
  commentAutomationService,
  flowService,
  listLockedIds,
} from "@chatbotx.io/business"
import { notFound } from "next/navigation"
import { FlowDetail } from "@/features/flows/flow-detail"
import { isSameContent } from "@/features/flows/flow-version-content"
import type { FlowTrigger } from "@/features/flows/react-flow/flow-triggers-context"
import { listIntegrationOpenaiCompatible } from "@/features/integration-openai-compatible/queries"
import { withWorkspaceIdAndIdSchema } from "@/features/workspaces/schema/resource"
import { requireWorkspacePermission } from "@/lib/auth/require-workspace-permission"
import { getCurrentUserAndTargetWorkspace } from "@/lib/auth/utils"
import { isNotFoundException } from "@/lib/errors/validation-exception"

type ReplyLike = {
  type?: string | null
  value?: string | null
  values?: { value?: string }[] | null
} | null

/**
 * CaveChat: the Instagram comment automations whose private reply runs this
 * flow, for the Gaio-style "Gatilho" block. Never blocks the editor.
 */
async function loadFlowTriggers(
  workspaceId: string,
  flowId: string,
): Promise<FlowTrigger[]> {
  try {
    const { data } = await commentAutomationService.listIgComments({
      workspaceId,
      includeAllFolders: true,
      page: 1,
      perPage: 100,
    })
    return data
      .filter((automation) => {
        const reply = automation.privateReply as ReplyLike
        return reply?.type === "flow" && String(reply.value) === String(flowId)
      })
      .map((automation) => {
        const post = automation.post as { type?: string; value?: string[] }
        const keywords = automation.includeKeywords as {
          type?: string
          value?: string[]
        }
        const publicReply = automation.publicReply as ReplyLike
        const publicReplies =
          publicReply?.type === "text"
            ? (publicReply.values?.length ?? (publicReply.value ? 1 : 0))
            : 0
        return {
          id: String(automation.id),
          name: String(automation.name ?? ""),
          isActive: Boolean(automation.isActive),
          postType: post?.type ?? "all",
          postCount: post?.value?.length ?? 0,
          keywordType: keywords?.type ?? "all",
          keywords: keywords?.value ?? [],
          publicReplies,
        }
      })
  } catch {
    return []
  }
}

type FlowPageProps = {
  params: Promise<{ workspaceId: string; id: string }>
}

export default async function FlowPage({ params }: FlowPageProps) {
  const { data } = await withWorkspaceIdAndIdSchema.safeParse(await params)
  if (!data) {
    return notFound()
  }

  await requireWorkspacePermission(data.workspaceId, "flows")

  let flow: Awaited<ReturnType<typeof flowService.findById>>
  try {
    flow = await flowService.findById({
      id: data.id,
      workspaceId: data.workspaceId,
    })
  } catch (error) {
    if (isNotFoundException(error)) {
      return notFound()
    }
    throw error
  }

  const draftFlowVersion = flow.flowVersions?.find((v) => v.isDraft)
  if (!draftFlowVersion) {
    return notFound()
  }

  // A copy installed from a View-only template opens read-only. The write
  // paths refuse independently, so this only spares the editor a failed save.
  const [openaiCompatibleIntegrations, access, lockedFlowIds, flowTriggers] =
    await Promise.all([
      listIntegrationOpenaiCompatible({ workspaceId: data.workspaceId }),
      // Already loaded for this request by the permission check above.
      getCurrentUserAndTargetWorkspace(data.workspaceId),
      listLockedIds({
        workspaceId: data.workspaceId,
        resourceKind: "flow",
        resourceIds: [flow.id],
      }),
      loadFlowTriggers(data.workspaceId, flow.id),
    ])
  const publishedVersion = flow.flowVersions?.find(
    (v) => v.isLatest && !v.isDraft,
  )
  const hasPublishedVersion = publishedVersion !== undefined
  const canRevertToPublished =
    hasPublishedVersion &&
    !isSameContent(
      draftFlowVersion.nodes,
      draftFlowVersion.edges,
      publishedVersion.nodes,
      publishedVersion.edges,
    )

  return (
    <div className="flex h-screen w-screen flex-col">
      <FlowDetail
        canRevertToPublished={canRevertToPublished}
        flow={flow}
        flowTriggers={flowTriggers}
        flowVersion={draftFlowVersion}
        hasPublishedVersion={hasPublishedVersion}
        isTemplateLocked={lockedFlowIds.length > 0}
        openaiCompatibleIntegrations={openaiCompatibleIntegrations}
        workspaceTargetCountry={access?.targetWorkspace.targetCountry ?? null}
      />
    </div>
  )
}
