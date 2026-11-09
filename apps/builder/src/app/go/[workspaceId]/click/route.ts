import { flowVersionService } from "@chatbotx.io/business"
import {
  and,
  db,
  desc,
  eq,
  sql,
} from "@chatbotx.io/database/client"
import { contactInboxRepository } from "@chatbotx.io/database/repositories"
import { flowVersionModel } from "@chatbotx.io/database/schema"
import { verifyShopToken } from "@chatbotx.io/encryption/shop-token"
import { emit } from "@chatbotx.io/event-bus"
import {
  clickTypeSchema,
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

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CLICK_KEY = /^[A-Za-z0-9_-]{8,64}$/

// Link-preview crawlers fetch the URL without anyone tapping it; they must not
// run the contact's click actions.
const CRAWLER_USER_AGENT =
  /facebookexternalhit|facebookcatalog|meta-externalagent|meta-externalfetcher|Facebot|Instagram-?Bot|WhatsApp\/|TelegramBot|Twitterbot|Slackbot|Discordbot|LinkedInBot|Googlebot|bingbot|crawler|spider|preview/i

type LinkButton = { id: string; url: string }

/** The link button (step button or quick reply) whose URL carries `k=<key>`. */
const findLinkButton = (node: unknown, key: string): LinkButton | null => {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findLinkButton(item, key)
      if (found) {
        return found
      }
    }
    return null
  }
  if (!node || typeof node !== "object") {
    return null
  }
  const record = node as Record<string, unknown>
  const beforeStep = record.beforeStep as Record<string, unknown> | undefined
  if (
    record.buttonType === "openWebsite" &&
    typeof record.id === "string" &&
    typeof beforeStep?.url === "string"
  ) {
    try {
      const url = new URL(beforeStep.url)
      if (url.searchParams.get("k") === key) {
        return { id: record.id, url: beforeStep.url }
      }
    } catch {
      // not a parseable URL: not ours
    }
  }
  for (const value of Object.values(record)) {
    const found = findLinkButton(value, key)
    if (found) {
      return found
    }
  }
  return null
}

const destinationOf = (button: LinkButton): string | null => {
  try {
    const u = new URL(button.url).searchParams.get("u")
    if (!u) {
      return null
    }
    const destination = Buffer.from(u, "base64url").toString("utf8")
    const parsed = new URL(destination)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? destination
      : null
  } catch {
    return null
  }
}

/**
 * Tracked link-button click. Instagram opens `web_url` buttons without telling
 * the bot, so a link button that must run actions on click (tag the contact,
 * jump to a node) carries this URL: the actions run for the contact named by
 * the signed `{{shop_token}}`, exactly as a postback tap on the same button
 * would run them, and the contact is redirected to the destination stored in
 * the flow. A click that cannot be attributed still redirects.
 */
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string }> },
) => {
  const { workspaceId } = await context.params
  const key = request.nextUrl.searchParams.get("k") ?? ""
  if (!(CLICK_KEY.test(key) && /^\d+$/.test(workspaceId))) {
    return NextResponse.json({ message: "Invalid link" }, { status: 400 })
  }

  const versions = await db
    .select()
    .from(flowVersionModel)
    .where(
      and(
        eq(flowVersionModel.workspaceId, workspaceId),
        sql`CAST(${flowVersionModel.nodes} AS text) LIKE ${`%k=${key}%`}`,
      ),
    )
    .orderBy(desc(flowVersionModel.createdAt))
    .limit(10)

  let button: LinkButton | null = null
  for (const version of versions) {
    button = findLinkButton(version.nodes, key)
    if (button) {
      break
    }
  }
  const destination = button ? destinationOf(button) : null
  if (!(button && destination)) {
    return NextResponse.json({ message: "Link not found" }, { status: 404 })
  }
  const redirect = NextResponse.redirect(destination, 302)

  try {
    const { servable } = await loadServableWorkspace(workspaceId)
    if (!servable) {
      return redirect
    }
    if (CRAWLER_USER_AGENT.test(request.headers.get("user-agent") ?? "")) {
      return redirect
    }
    const token = request.nextUrl.searchParams.get("t")
    if (!token || token.includes("{{")) {
      return redirect
    }
    let contactInboxId: string | null = null
    try {
      const payload = await verifyShopToken(token)
      if (payload.mode === "customer" && payload.workspaceId === workspaceId) {
        contactInboxId = payload.contactInboxId
      }
    } catch {
      return redirect
    }
    if (!contactInboxId) {
      return redirect
    }

    const contactInbox = await contactInboxRepository.findByIdWithConversation({
      id: contactInboxId,
    })
    if (
      !contactInbox?.conversation ||
      contactInbox.conversation.workspaceId !== workspaceId
    ) {
      return redirect
    }

    // The live (published) version of the flow that holds this button.
    const flowId = versions.find((version) =>
      findLinkButton(version.nodes, key),
    )?.flowId
    const live = flowId
      ? await flowVersionService.findForButtonPayload({ flowId, workspaceId })
      : undefined
    const nodes = live?.nodes as unknown as FlowNode[] | undefined
    const liveButton = live ? findLinkButton(live.nodes, key) : null
    const target =
      nodes && liveButton ? resolveFlowActionTarget(nodes, liveButton.id) : null
    if (!(flowId && liveButton && target?.nodeId)) {
      logger.warn(
        { workspaceId, flowId, key },
        "Tracked link click could not be attributed: button not in a published version",
      )
      return redirect
    }

    await emit(flowEventTypeSchema.enum["flow:clicked"], {
      nodeId: target.nodeId,
      context: {
        workspaceId,
        contactId: contactInbox.contactId,
        conversationId: contactInbox.conversation.id,
        channel: contactInbox.channel,
        contactInboxId,
      },
      action: {
        flowId,
        buttonId: liveButton.id,
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
        contactInboxId,
        flowId,
        nodeId: target.nodeId,
        targetType: target.targetType,
        targetId: liveButton.id,
        origin: "channel",
      },
    })
  } catch (error) {
    logger.error({ err: error, workspaceId }, "Tracked link click failed")
  }

  return redirect
}
