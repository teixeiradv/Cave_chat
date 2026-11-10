import {
  buttonTypes,
  type FlowNode,
  type FlowRouteUpdate,
  startAnotherNodeStepDefaultFn,
  stepTypes,
} from "@chatbotx.io/flow-config"

/**
 * Link (openWebsite) buttons have their own output on the canvas, like Gaio's
 * link buttons: the edge is the path the contact takes after clicking.
 *
 * The engine cannot be told about a click on an Instagram link by the channel,
 * so the click is tracked by the builder route `/go/<workspace>/click`, which
 * runs the button's own actions. Drawing the edge therefore (1) makes the
 * button's URL a tracked one and (2) keeps a "start node" action pointing at
 * the edge's target in the button's actions. The button stays a link — the
 * generic route writer would turn it into a postback and lose the URL.
 */

type LinkButton = {
  id: string
  buttonType: string | null
  // biome-ignore lint/suspicious/noExplicitAny: button actions are a step union
  beforeStep: any
  // biome-ignore lint/suspicious/noExplicitAny: button actions are a step union
  steps?: any[]
}

type TrackingContext = { origin: string; workspaceId: string }

const TRACKED_URL = /\/go\/\d+\/click\?/
const KEY_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

const randomKey = () => {
  const bytes = new Uint8Array(20)
  globalThis.crypto.getRandomValues(bytes)
  let key = ""
  for (const byte of bytes) {
    key += KEY_ALPHABET[byte % KEY_ALPHABET.length]
  }
  return key
}

const toBase64Url = (value: string) => {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** The tracked click URL for a link, or the link itself when it cannot be tracked. */
export const toTrackedLinkUrl = (url: unknown, context: TrackingContext) => {
  if (typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return url
  }
  if (TRACKED_URL.test(url) || url.includes("{{")) {
    return url
  }
  return `${context.origin}/go/${context.workspaceId}/click?k=${randomKey()}&u=${toBase64Url(url)}&t={{shop_token}}`
}

const isLinkButton = (button: unknown): button is LinkButton =>
  !!button &&
  typeof button === "object" &&
  (button as LinkButton).buttonType === buttonTypes.enum.openWebsite

const buttonCollections = (node: FlowNode): LinkButton[][] => {
  const details = node.data.details as {
    steps?: { buttons?: LinkButton[] }[]
    quickReplies?: LinkButton[]
  }
  return [
    ...(details.steps ?? []).map((step) => step.buttons ?? []),
    details.quickReplies ?? [],
  ]
}

export const isLinkButtonHandle = (
  nodes: readonly FlowNode[],
  sourceNodeId: string,
  handleId: string,
) => {
  const node = nodes.find((candidate) => candidate.id === sourceNodeId)
  if (!node) {
    return false
  }
  for (const buttons of buttonCollections(node)) {
    const button = buttons.find((candidate) => candidate?.id === handleId)
    if (button) {
      return isLinkButton(button)
    }
  }
  return false
}

const routeLinkButton = (
  button: LinkButton,
  targetNodeId: string | null,
  context: TrackingContext,
): LinkButton => {
  const otherActions = (button.steps ?? []).filter(
    (step) => step?.stepType !== stepTypes.enum.startAnotherNode,
  )
  if (!targetNodeId) {
    return { ...button, steps: otherActions }
  }
  return {
    ...button,
    beforeStep: button.beforeStep
      ? {
          ...button.beforeStep,
          url: toTrackedLinkUrl(button.beforeStep.url, context),
        }
      : button.beforeStep,
    steps: [
      ...otherActions,
      startAnotherNodeStepDefaultFn({ nodeId: targetNodeId }),
    ],
  }
}

/** Splits route updates into link-button ones and everything else. */
export const splitLinkButtonRoutes = (
  nodes: readonly FlowNode[],
  updates: readonly FlowRouteUpdate[],
) => {
  const linkUpdates: FlowRouteUpdate[] = []
  const otherUpdates: FlowRouteUpdate[] = []
  for (const update of updates) {
    if (isLinkButtonHandle(nodes, update.sourceNodeId, update.handleId)) {
      linkUpdates.push(update)
    } else {
      otherUpdates.push(update)
    }
  }
  return { linkUpdates, otherUpdates }
}

export const applyLinkButtonRoutes = <N extends FlowNode>(
  nodes: N[],
  updates: readonly FlowRouteUpdate[],
  context: TrackingContext,
): N[] => {
  if (updates.length === 0) {
    return nodes
  }
  return nodes.map((node) => {
    const nodeUpdates = updates.filter(
      (update) => update.sourceNodeId === node.id,
    )
    if (nodeUpdates.length === 0) {
      return node
    }
    const route = (button: LinkButton) => {
      const update = nodeUpdates.find((item) => item.handleId === button?.id)
      return update && isLinkButton(button)
        ? routeLinkButton(button, update.route?.targetNodeId ?? null, context)
        : button
    }
    const details = node.data.details as {
      steps?: { buttons?: LinkButton[] }[]
      quickReplies?: LinkButton[]
    }
    return {
      ...node,
      data: {
        ...node.data,
        details: {
          ...details,
          ...(Array.isArray(details.steps)
            ? {
                steps: details.steps.map((step) =>
                  Array.isArray(step.buttons)
                    ? { ...step, buttons: step.buttons.map(route) }
                    : step,
                ),
              }
            : {}),
          ...(Array.isArray(details.quickReplies)
            ? { quickReplies: details.quickReplies.map(route) }
            : {}),
        },
      },
    } as N
  })
}
