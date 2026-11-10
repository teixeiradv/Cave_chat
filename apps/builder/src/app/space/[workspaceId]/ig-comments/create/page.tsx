import { notFound, redirect } from "next/navigation"
import type { SearchParams } from "nuqs/server"
import { CreateIgCommentForm } from "@/features/ig-comments/components/create-ig-comment-form"
import { IgCommentPostsStoreProvider } from "@/features/ig-comments/provider/ig-comment-posts-store-context"
import { igCommentVariants } from "@/features/ig-comments/schema/action"
import { isLivePostTypeParam } from "@/features/shared/comment-automation/lib/live-post-type"
import { withWorkspaceIdSchema } from "@/features/workspaces/schema/resource"

export default async function CreateIgCommentPage(props: {
  params: Promise<{ workspaceId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { data } = withWorkspaceIdSchema.safeParse(await props.params)
  if (!data) {
    return notFound()
  }

  const {
    variant: rawVariant,
    postType,
    flowId: rawFlowId,
    returnTo: rawReturnTo,
    name: rawName,
  } = await props.searchParams
  // CaveChat: opened from the "Gatilho" block of a flow — preset that flow as
  // the private reply and go back to the flow after saving.
  const presetFlowId =
    typeof rawFlowId === "string" && /^\d+$/.test(rawFlowId)
      ? rawFlowId
      : undefined
  const returnTo =
    typeof rawReturnTo === "string" &&
    rawReturnTo.startsWith(`/space/${data.workspaceId}/`)
      ? rawReturnTo
      : undefined
  const presetName =
    typeof rawName === "string" ? rawName.slice(0, 255) : undefined
  const isLive = isLivePostTypeParam(postType)
  const { data: variant } = igCommentVariants.safeParse(rawVariant)
  if (!variant) {
    redirect(`/space/${data.workspaceId}/ig-comments`)
  }

  return (
    // A Live automation has no post picker, so its media is never fetched.
    <IgCommentPostsStoreProvider
      autoInitialize={!isLive}
      variant={variant}
      workspaceId={data.workspaceId}
    >
      <CreateIgCommentForm
        isLive={isLive}
        presetFlowId={presetFlowId}
        presetName={presetName}
        returnTo={returnTo}
        variant={variant}
        workspaceId={data.workspaceId}
      />
    </IgCommentPostsStoreProvider>
  )
}
