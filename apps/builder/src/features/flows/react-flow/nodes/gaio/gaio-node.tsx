"use client"

import {
  type ButtonStepProps,
  type FlowNode,
  listQuickReplySettingsHandles,
  type NodeType,
  nodeTypeSchema,
  shouldShowDefaultContinue,
  stepTypes,
} from "@chatbotx.io/flow-config"
import { cn } from "@chatbotx.io/ui/lib/utils"
import { NodeToolbar, Position } from "@xyflow/react"
import {
  ClockIcon,
  MailIcon,
  MessageCircleIcon,
  PlayCircleIcon,
  ShuffleIcon,
  TagIcon,
  WorkflowIcon,
  ZapIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { memo, type ReactNode } from "react"
import { BaseHandle } from "@/components/base-handle"
import { FlowNodeToolbar } from "../../toolbar/node-toolbar"
import { allNodesConfig } from "../node-config"
import { GaioButtonRow, GaioStepElement } from "./gaio-elements"
import {
  formatDuration,
  GaioNextStep,
  GaioOutputRow,
  IconBadge,
  InstagramBadge,
} from "./gaio-ui"
import { GaioTriggerCard } from "./gaio-trigger"

type GaioNodeProps = {
  id: string
  type: NodeType
  selected?: boolean
  data: FlowNode["data"] & { forceToolbarVisible?: boolean }
}

// biome-ignore lint/suspicious/noExplicitAny: canvas node details arrive unparsed from the draft
type AnyDetails = Record<string, any>

const TAG_STEP_TYPES: readonly string[] = [
  stepTypes.enum.addContactTag,
  stepTypes.enum.removeContactTag,
]

const HeaderIcon = ({
  type,
  details,
}: {
  type: NodeType
  details: AnyDetails
}) => {
  const t = useTranslations()
  switch (type) {
    case nodeTypeSchema.enum.sendMessage:
      return details.beforeStep?.channel === "instagram" ? (
        <InstagramBadge />
      ) : (
        <IconBadge>
          <MessageCircleIcon />
        </IconBadge>
      )
    case nodeTypeSchema.enum.wait:
      return (
        <IconBadge>
          <ClockIcon />
        </IconBadge>
      )
    case nodeTypeSchema.enum.condition:
      return (
        <IconBadge>
          <WorkflowIcon />
        </IconBadge>
      )
    case nodeTypeSchema.enum.splitTraffic:
      return (
        <IconBadge>
          <ShuffleIcon />
        </IconBadge>
      )
    case nodeTypeSchema.enum.sendMail:
      return (
        <IconBadge>
          <MailIcon />
        </IconBadge>
      )
    case nodeTypeSchema.enum.performAction: {
      const steps: { stepType: string }[] = details.steps ?? []
      const onlyTags =
        steps.length > 0 &&
        steps.every((step) => TAG_STEP_TYPES.includes(step.stepType))
      return <IconBadge>{onlyTags ? <TagIcon /> : <ZapIcon />}</IconBadge>
    }
    default: {
      const config = allNodesConfig[type]?.(t)
      return config?.icon ? (
        <IconBadge>
          <config.icon />
        </IconBadge>
      ) : null
    }
  }
}

/** The "Sem resposta em X horas" / "Tentar de novo" outputs under the buttons. */
const QuickReplySettingsRows = ({ details }: { details: AnyDetails }) => {
  const t = useTranslations()
  const handles = listQuickReplySettingsHandles(details)
  if (handles.length === 0) {
    return null
  }
  const followUp = details.quickReplySettings?.followUp

  return (
    <>
      {handles.map((handle) => (
        <GaioOutputRow
          handleId={handle.id}
          key={handle.id}
          label={
            handle.kind === "followUp"
              ? `Sem resposta em ${formatDuration(followUp?.duration, followUp?.unit)}`
              : t("flows.quickReplySettings.retry.handle")
          }
          muted
        />
      ))}
    </>
  )
}

const Tab = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 rounded-t-md px-2 py-0.5 font-semibold text-[11px] text-white",
      className,
    )}
  >
    {children}
  </div>
)

/**
 * A flow node drawn like a Gaio block: header with the channel / block icon and
 * name, the block's content as Gaio elements (text, buttons, media, wait,
 * question, tags, condition) with one output per button / outcome, and the
 * "Próximo passo" output in the footer.
 */
export const GaioNodeViewer = memo((props: GaioNodeProps) => {
  const { id, type, data, selected } = props
  const details = data.details as AnyDetails | undefined

  if (!details) {
    return <div>Bloco não encontrado</div>
  }

  const steps: { id: string; stepType: string }[] = Array.isArray(
    details.steps,
  )
    ? details.steps
    : []
  const quickReplies: ButtonStepProps[] = Array.isArray(details.quickReplies)
    ? details.quickReplies
    : []
  const showNextStep = shouldShowDefaultContinue(type, data)
  const isEmpty =
    steps.length === 0 &&
    quickReplies.length === 0 &&
    (type === nodeTypeSchema.enum.sendMessage ||
      type === nodeTypeSchema.enum.performAction)

  return (
    <>
      <div className="absolute flex min-h-6 w-full -translate-y-full transform items-end gap-1">
        {data.isStartNode && (
          <Tab className="bg-primary">
            <PlayCircleIcon size={12} />
            Início
          </Tab>
        )}
        {selected && <Tab className="bg-neutral-600">Selecionado</Tab>}
      </div>

      {data.isStartNode ? <GaioTriggerCard /> : null}

      <NodeToolbar isVisible={data.forceToolbarVisible} offset={5}>
        <FlowNodeToolbar isStartNode={data.isStartNode} nodeId={id} />
      </NodeToolbar>

      <div
        className={cn(
          "w-[300px] overflow-visible rounded-xl border bg-card text-card-foreground shadow-sm transition-shadow",
          selected && "border-primary ring-1 ring-primary",
          data.isStartNode && !selected && "border-primary/60",
        )}
      >
        <div className="relative flex h-12 items-center gap-2 rounded-t-xl border-b px-4">
          <BaseHandle
            id={id}
            isConnectableStart={false}
            position={Position.Left}
            type="target"
          />
          <HeaderIcon details={details} type={type} />
          <p className="min-w-0 flex-1 truncate font-semibold text-sm">
            {data.name}
          </p>
        </div>

        <div className="flex flex-col gap-3 p-4">
          {type === nodeTypeSchema.enum.startFlow ? (
            <p className="rounded-lg bg-muted px-4 py-3 text-sm">
              Inicia outra automação
            </p>
          ) : null}

          {steps.map((step) => (
            // biome-ignore lint/suspicious/noExplicitAny: step union from the draft
            <GaioStepElement key={step.id} nodeId={id} step={step as any} />
          ))}

          {quickReplies.length > 0 ? (
            <div className="flex flex-col gap-2">
              {quickReplies.map((button) => (
                <GaioButtonRow button={button} key={button.id} />
              ))}
            </div>
          ) : null}

          {"quickReplySettings" in details ? (
            <QuickReplySettingsRows details={details} />
          ) : null}

          {isEmpty ? (
            <p className="text-center text-muted-foreground text-xs">
              Clique para adicionar conteúdo
            </p>
          ) : null}
        </div>

        {showNextStep ? <GaioNextStep nodeId={id} /> : null}
      </div>
    </>
  )
})

GaioNodeViewer.displayName = "GaioNodeViewer"
