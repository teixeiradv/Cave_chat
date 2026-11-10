"use client"

import { cn } from "@chatbotx.io/ui/lib/utils"
import {
  ChevronRightIcon,
  MessageCircleIcon,
  PlusIcon,
  TriangleAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SelectInstagramConnectionTypeDialog } from "@/features/ig-comments/components/select-instagram-connection-type-dialog"
import { useInboxListState } from "@/features/inboxes/provider/inbox-hook"
import { type FlowTrigger, useFlowTriggers } from "../../flow-triggers-context"
import { InstagramBadge } from "./gaio-ui"

const postLabel = (trigger: FlowTrigger) => {
  switch (trigger.postType) {
    case "postIds":
      return `Comentário em ${trigger.postCount} ${trigger.postCount === 1 ? "post escolhido" : "posts escolhidos"}`
    case "reels":
      return "Comentário em Reels"
    case "ads":
      return "Comentário em anúncios"
    case "live":
      return "Comentário em live"
    default:
      return "Comentário no Feed ou Reels"
  }
}

const keywordLabel = (trigger: FlowTrigger) => {
  if (trigger.keywordType === "all") {
    return "Qualquer comentário"
  }
  if (trigger.keywordType === "mentions") {
    return "Comentário que marca pessoas"
  }
  const words = trigger.keywords.join(", ")
  return trigger.keywordType === "equal"
    ? `Igual a: ${words}`
    : `Palavras-chave: ${words}`
}

const stop = (event: { stopPropagation: () => void }) => event.stopPropagation()

/**
 * Gaio's first block ("Gatilho"): drawn to the left of the start block, it
 * lists what starts the automation (the Instagram comment automations whose
 * private reply runs this flow) and creates a new one already pointing at
 * this flow, coming back here after saving. It is not a flow node, so nothing
 * about it is saved in the flow.
 */
export const GaioTriggerCard = () => {
  const value = useFlowTriggers()
  const { inboxes, status } = useInboxListState()
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
  if (!value) {
    return null
  }
  const { workspaceId, flowId, flowName, triggers } = value
  const base = `/space/${workspaceId}`
  const hasInstagram = inboxes.some((inbox) => inbox.channel === "instagram")
  const createQuery = new URLSearchParams({
    flowId,
    name: `Gatilho: ${flowName}`.slice(0, 255),
    returnTo: `${base}/flows/${flowId}`,
  }).toString()

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: only stops the click from selecting the start block
    // biome-ignore lint/a11y/useKeyWithClickEvents: same
    <div
      className="nodrag nopan nowheel absolute top-0 right-[calc(100%+72px)] w-[300px] cursor-default"
      onClick={stop}
      onDoubleClick={stop}
      onMouseDown={stop}
      onPointerDown={stop}
    >
      <div className="absolute -top-6 left-0 inline-flex items-center gap-1 rounded-t-md bg-neutral-600 px-2 py-0.5 font-semibold text-[11px] text-white">
        Gatilho
      </div>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <InstagramBadge />
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs">Instagram</p>
            <p className="font-semibold text-sm">O que inicia a automação</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {status === "success" && !hasInstagram ? (
            <Link
              className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-amber-700 text-xs dark:text-amber-300"
              href={`${base}/settings/channels/instagram`}
              rel="noreferrer"
              target="_blank"
            >
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
              <span>
                Nenhuma conta do Instagram conectada neste workspace. Sem ela
                nenhum gatilho dispara — conecte em Configurações › Canais ›
                Instagram.
              </span>
            </Link>
          ) : null}
          <p className="text-muted-foreground text-xs">Gatilhos ativos</p>
          {triggers.length === 0 ? (
            <p className="rounded-lg bg-muted px-3 py-2.5 text-muted-foreground text-sm">
              Nenhum gatilho aponta para esta automação ainda.
            </p>
          ) : (
            triggers.map((trigger) => (
              <Link
                className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm transition hover:bg-accent"
                href={`${base}/ig-comments/${trigger.id}`}
                key={trigger.id}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircleIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">
                    {postLabel(trigger)}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    {keywordLabel(trigger)}
                  </span>
                  {trigger.publicReplies > 0 ? (
                    <span className="truncate text-muted-foreground text-xs">
                      Responde no comentário ({trigger.publicReplies}{" "}
                      {trigger.publicReplies === 1 ? "resposta" : "respostas"})
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 font-medium text-[10px]",
                    trigger.isActive
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : "bg-muted-foreground/15 text-muted-foreground",
                  )}
                >
                  {trigger.isActive ? "Ativo" : "Pausado"}
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))
          )}
          <div className="mt-1 flex flex-col gap-1.5">
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 font-medium text-sm transition hover:bg-accent"
              onClick={() => setConnectionDialogOpen(true)}
              type="button"
            >
              <PlusIcon className="size-4" />
              Adicionar gatilho
            </button>
            <Link
              className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-muted-foreground text-xs transition hover:bg-accent"
              href={`${base}/automated-responses/create`}
              rel="noreferrer"
              target="_blank"
            >
              <PlusIcon className="size-3.5" />
              Palavra-chave no Direct
            </Link>
          </div>
        </div>
        <div className="border-t px-4 py-2 text-end text-muted-foreground text-xs">
          Próximo passo
        </div>
      </div>
      {/* Connector to the start block, like Gaio's first edge. */}
      <div className="pointer-events-none absolute top-6 left-full h-0.5 w-[72px] bg-muted-foreground/50" />
      <SelectInstagramConnectionTypeDialog
        createQuery={createQuery}
        onOpenChange={setConnectionDialogOpen}
        open={connectionDialogOpen}
        workspaceId={workspaceId}
      />
    </div>
  )
}
