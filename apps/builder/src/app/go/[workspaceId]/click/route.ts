import { flowVersionService } from "@chatbotx.io/business"
import { resolveTrackedClick } from "@chatbotx.io/business/open-link"
import { contactInboxRepository } from "@chatbotx.io/database/repositories"
import { emit } from "@chatbotx.io/event-bus"
import {
  clickTypeSchema,
  decodeButtonPayload,
  type FlowNode,
  flowEventTypeSchema,
  resolveFlowActionTarget,
} from "@chatbotx.io/flow-config"
import {
  IntegrationJobAction,
  integrationQueue,
} from "@chatbotx.io/worker-config"
import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/log"
import { loadServableWorkspace } from "@/lib/workspace/load-servable-workspace"

// node:crypto verifies the signature.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Link-preview crawlers fetch the URL without anyone tapping it; they must not
// run the contact's click actions.
const CRAWLER_USER_AGENT =
  /facebookexternalhit|facebookcatalog|meta-externalagent|meta-externalfetcher|Facebot|Instagram-?Bot|WhatsApp\/|TelegramBot|Twitterbot|Slackbot|Discordbot|LinkedInBot|Googlebot|bingbot|crawler|spider|preview/i

/**
 * Tracked link button click (see `buildTrackedClickUrl`): runs the button's
 * own actions for the contact the payload names — exactly what a postback tap
 * on the same button would run — and redirects to the destination. A click
 * that cannot be attributed still redirects: the contact tapped a link.
 */
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) => {
  const { workspaceId } = await context.params
  const resolved = resolveTrackedClick({
    workspaceId,
    u: request.nextUrl.searchParams.get("u"),
    c: request.nextUrl.searchParams.get("c"),
    s: request.nextUrl.searchParams.get("s"),
  })
  if (!resolved) {
    return NextResponse.json({ message: "Invalid link" }, { status: 400 })
  }
  const destination = NextResponse.redirect(resolved.url, 302)

  try {
    const { servable } = await loadServableWorkspace(workspaceId)
    if (!servable) {
      return destination
    }
    if (CRAWLER_USER_AGENT.test(request.headers.get("user-agent") ?? "")) {
      return destination
    }

    const payload = decodeButtonPayload(resolved.code)
    if (!(payload?.contactInboxId && payload.buttonId && payload.flowId)) {
      return destination
    }

    const contactInbox = await contactInboxRepository.findByIdWithConversation({
      id: payload.contactInboxId,
    })
    if (
      !contactInbox?.conversation ||
      contactInbox.conversation.workspaceId !== workspaceId
    ) {
      return destination
    }

    const flowVersion = await flowVersionService.findForButtonPayload({
      flowId: payload.flowId,
      workspaceId,
      versionId: payload.flowVersionId,
    })
    const nodes = flowVersion?.nodes as unknown as FlowNode[] | undefined
    const target = nodes
      ? resolveFlowActionTarget(nodes, payload.buttonId)
      : null
    if (!target?.nodeId) {
      logger.warn(
        { workspaceId, flowId: payload.flowId, buttonId: payload.buttonId },
        "Tracked link click could not be attributed: button not in the live version",
      )
      return destination
    }

    await emit(flowEventTypeSchema.enum["flow:clicked"], {
      nodeId: target.nodeId,
      context: {
        workspaceId,
        contactId: contactInbox.contactId,
        conversationId: contactInbox.conversation.id,
        channel: contactInbox.channel,
        contactInboxId: payload.contactInboxId,
      },
      action: {
        flowId: payload.flowId,
        buttonId: payload.buttonId,
        broadcastId: payload.broadcastId,
        sequenceStepId: payload.sequenceStepId,
        commentAutomationId: payload.commentAutomationId,
        clickType:
          target.targetType === "quickReply"
            ? clickTypeSchema.enum.quick_reply
            : clickTypeSchema.enum.button,
      },
      occurredAt: new Date(),
    })

    await integrationQueue.add(IntegrationJobAction.sendFlow, {
      type: IntegrationJobAction.sendFlow,
      data: {
        conversationId: contactInbox.conversation.id,
        contactInboxId: payload.contactInboxId,
        flowId: payload.flowId,
        nodeId: target.nodeId,
        targetType: target.targetType,
        targetId: payload.buttonId,
        origin: "channel",
      },
    })
  } catch (error) {
    logger.error({ err: error, workspaceId }, "Tracked link click failed")
  }

  return destination
}
