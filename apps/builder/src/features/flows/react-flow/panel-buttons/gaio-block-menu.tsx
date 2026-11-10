"use client"

import {
  type FlowNode,
  type NodeType,
  nodeTypeSchema,
  type StepType,
  stepTypes,
} from "@chatbotx.io/flow-config"
import { Input } from "@chatbotx.io/ui/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@chatbotx.io/ui/components/ui/popover"
import { cn } from "@chatbotx.io/ui/lib/utils"
import { type ReactFlowInstance, useReactFlow } from "@xyflow/react"
import {
  ClockIcon,
  CodeIcon,
  GlobeIcon,
  FocusIcon,
  MailIcon,
  MessageCircleIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  SearchIcon,
  ShuffleIcon,
  TagIcon,
  WorkflowIcon,
  ZapIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useMemo, useState } from "react"
import { InstagramBadge } from "../nodes/gaio/gaio-ui"
import { allNodesConfig } from "../nodes/node-config"
import type { TranslationFn } from "../nodes/types"
import { allSteps } from "../steps"

type BlockItem = {
  key: string
  label: string
  description?: string
  icon: ReactNode
  nodeType: NodeType
  /** Name prefix for the new block ("Mensagem #3"). */
  name: string
  /** Steps the new block starts with (Gaio blocks are never empty). */
  steps?: StepType[]
  advanced?: boolean
}

const BLOCKS: BlockItem[] = [
  {
    key: "message",
    label: "Mensagem",
    description: "Texto, vídeo, galeria, botões e outros.",
    icon: <InstagramBadge className="size-5" />,
    nodeType: nodeTypeSchema.enum.sendMessage,
    name: "Mensagem",
    steps: [stepTypes.enum.sendText],
  },
  {
    key: "tags",
    label: "Adicionar ou remover etiquetas",
    icon: <TagIcon />,
    nodeType: nodeTypeSchema.enum.performAction,
    name: "Adicionar ou remover etiquetas",
    steps: [stepTypes.enum.addContactTag],
  },
  {
    key: "wait",
    label: "Aguardar",
    icon: <ClockIcon />,
    nodeType: nodeTypeSchema.enum.wait,
    name: "Aguardar",
  },
  {
    key: "condition",
    label: "Condicional",
    icon: <WorkflowIcon />,
    nodeType: nodeTypeSchema.enum.condition,
    name: "Condicional",
  },
  {
    key: "split",
    label: "Distribuir",
    icon: <ShuffleIcon />,
    nodeType: nodeTypeSchema.enum.splitTraffic,
    name: "Distribuir",
  },
  {
    key: "startFlow",
    label: "Iniciar automação",
    icon: <PlayCircleIcon />,
    nodeType: nodeTypeSchema.enum.startFlow,
    name: "Iniciar automação",
    advanced: true,
  },
  {
    key: "customField",
    label: "Campo personalizado",
    icon: <PencilIcon />,
    nodeType: nodeTypeSchema.enum.performAction,
    name: "Campo personalizado",
    steps: [stepTypes.enum.setCustomField],
    advanced: true,
  },
  {
    key: "http",
    label: "Requisição HTTP",
    icon: <GlobeIcon />,
    nodeType: nodeTypeSchema.enum.performAction,
    name: "Requisição HTTP",
    steps: [stepTypes.enum.callApi],
    advanced: true,
  },
  {
    key: "code",
    label: "Código",
    icon: <CodeIcon />,
    nodeType: nodeTypeSchema.enum.performAction,
    name: "Código",
    steps: [stepTypes.enum.executeJavascript],
    advanced: true,
  },
  {
    key: "actions",
    label: "Outras ações",
    icon: <ZapIcon />,
    nodeType: nodeTypeSchema.enum.performAction,
    name: "Ações",
    advanced: true,
  },
  {
    key: "followUp",
    label: "Acompanhamento",
    icon: <MessageCircleIcon />,
    nodeType: nodeTypeSchema.enum.followUp,
    name: "Acompanhamento",
    advanced: true,
  },
  {
    key: "mail",
    label: "Enviar e-mail",
    icon: <MailIcon />,
    nodeType: nodeTypeSchema.enum.sendMail,
    name: "E-mail",
    advanced: true,
  },
]

/** The channel the flow already sends on, so a new Mensagem block matches it. */
const flowChannel = (nodes: FlowNode[]): string | null => {
  for (const node of nodes) {
    if (node.type !== nodeTypeSchema.enum.sendMessage) {
      continue
    }
    const channel = (node.data.details as { beforeStep?: { channel?: string } })
      .beforeStep?.channel
    if (channel) {
      return channel
    }
  }
  return null
}

const countByPrefix = (nodes: FlowNode[], prefix: string) =>
  nodes.filter((node) => String(node.data?.name ?? "").startsWith(prefix))
    .length

/**
 * Builds a Gaio-style block on top of the existing node types: the engine
 * still receives a plain sendMessage / performAction / wait / … node.
 */
export function createGaioBlock(
  reactFlow: ReactFlowInstance,
  t: TranslationFn,
  item: Pick<BlockItem, "nodeType" | "name" | "steps">,
  position?: { x: number; y: number },
): FlowNode | null {
  const nodes = reactFlow.getNodes() as unknown as FlowNode[]
  const config = allNodesConfig[item.nodeType]?.(t)
  if (!config?.defaultFn) {
    return null
  }
  const stepDefaults = (item.steps ?? []).flatMap((stepType) => {
    const step = allSteps[stepType]?.defaultFn()
    return step ? [step] : []
  })
  const node = config.defaultFn({
    dataProps: {
      name: `${item.name} #${countByPrefix(nodes, item.name) + 1}`,
    },
    nodeProps: {
      position:
        position ??
        reactFlow.screenToFlowPosition({
          x: window.innerWidth / 2 - 150,
          y: window.innerHeight / 2 - 120,
        }),
    },
  }) as FlowNode
  const details = node.data.details as Record<string, unknown> & {
    beforeStep?: Record<string, unknown>
  }
  if (stepDefaults.length > 0 && Array.isArray(details.steps)) {
    details.steps = [...(details.steps as unknown[]), ...stepDefaults]
  }
  if (item.nodeType === nodeTypeSchema.enum.sendMessage && details.beforeStep) {
    const channel = flowChannel(nodes)
    if (channel) {
      details.beforeStep = { ...details.beforeStep, channel }
    }
  }
  reactFlow.addNodes([node])
  return node
}

const MenuOption = ({
  item,
  onSelect,
}: {
  item: BlockItem
  onSelect: (item: BlockItem) => void
}) => (
  <button
    className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none [&_svg]:size-4 [&_svg]:shrink-0"
    onClick={() => onSelect(item)}
    type="button"
  >
    <span className="mt-0.5 flex size-5 items-center justify-center text-muted-foreground">
      {item.icon}
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="font-medium">{item.label}</span>
      {item.description ? (
        <span className="text-muted-foreground text-xs">
          {item.description}
        </span>
      ) : null}
    </span>
  </button>
)

const ToolButton = ({
  children,
  label,
  onClick,
  className,
}: {
  children: ReactNode
  label: string
  onClick?: () => void
  className?: string
}) => (
  <button
    aria-label={label}
    className={cn(
      "flex size-10 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-accent hover:text-foreground [&_svg]:size-5",
      className,
    )}
    onClick={onClick}
    title={label}
    type="button"
  >
    {children}
  </button>
)

/** Gaio's vertical canvas toolbar: add block (+), zoom and fit. */
export function GaioCanvasToolbar({ isReadOnly }: { isReadOnly: boolean }) {
  const t = useTranslations()
  const reactFlow = useReactFlow()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const { main, advanced } = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const matches = BLOCKS.filter(
      (item) =>
        allNodesConfig[item.nodeType] &&
        (!normalized ||
          `${item.label} ${item.description ?? ""}`
            .toLowerCase()
            .includes(normalized)),
    )
    return {
      main: matches.filter((item) => !item.advanced),
      advanced: matches.filter((item) => item.advanced),
    }
  }, [query])

  const onSelect = (item: BlockItem) => {
    createGaioBlock(reactFlow, t, item)
    setOpen(false)
    setQuery("")
  }

  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border bg-card p-1.5 shadow-sm">
      {isReadOnly ? null : (
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger
            render={
              <button
                aria-label="Adicionar bloco"
                className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 [&_svg]:size-5"
                title="Adicionar bloco"
                type="button"
              >
                <PlusIcon />
              </button>
            }
          />
          <PopoverContent
            align="start"
            className="w-72 p-2"
            side="left"
            sideOffset={8}
          >
            <div className="relative mb-2">
              <SearchIcon className="absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                className="ps-8"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar"
                value={query}
              />
            </div>
            <div className="flex max-h-[60vh] flex-col overflow-y-auto">
              {main.map((item) => (
                <MenuOption item={item} key={item.key} onSelect={onSelect} />
              ))}
              {advanced.length > 0 ? (
                <>
                  <div className="mt-2 border-t px-2 pt-2 pb-1 font-medium text-muted-foreground text-xs">
                    Avançado
                  </div>
                  {advanced.map((item) => (
                    <MenuOption
                      item={item}
                      key={item.key}
                      onSelect={onSelect}
                    />
                  ))}
                </>
              ) : null}
              {main.length === 0 && advanced.length === 0 ? (
                <p className="px-2 py-3 text-center text-muted-foreground text-sm">
                  Nenhum bloco encontrado
                </p>
              ) : null}
            </div>
          </PopoverContent>
        </Popover>
      )}
      <ToolButton label="Aproximar" onClick={() => reactFlow.zoomIn()}>
        <ZoomInIcon />
      </ToolButton>
      <ToolButton label="Afastar" onClick={() => reactFlow.zoomOut()}>
        <ZoomOutIcon />
      </ToolButton>
      <ToolButton
        label="Ver o fluxo inteiro"
        onClick={() => reactFlow.fitView({ duration: 300 })}
      >
        <FocusIcon />
      </ToolButton>
    </div>
  )
}
