"use client"

import {
  type ButtonStepProps,
  buttonTypes,
  type ConditionStepSchema,
  type GetUserDataStepSchema,
  type StepType,
  stateTypes,
  stepTypes,
  type WaitStepSchema,
  waitStepDelayTypes,
} from "@chatbotx.io/flow-config"
import {
  ClockIcon,
  FileTextIcon,
  ImageIcon,
  LinkIcon,
  PhoneCallIcon,
  VideoIcon,
  Volume2Icon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { type ReactNode, useMemo } from "react"
import { replaceCouponVariableTokensWithLabels } from "@/components/tiptap/extensions/variable-injection/mention"
import { useBotFieldTokenLabels } from "@/components/tiptap/use-bot-field-token-labels"
import { formatFilterConditionValue } from "@/features/contact-filter/components/contact-filter-config"
import { useContactFilterConfigs } from "@/features/contact-filter/components/use-contact-filter-configs"
import { useCouponTopicOptions } from "@/features/coupons/provider/use-coupon-topic-options"
import { useCustomFields } from "@/features/custom-fields/provider/custom-field-hook"
import { useWorkspaceId } from "@/hooks/routing"
import { DynamicStepViewer } from "../../steps"
import { formatDuration, GaioBox, GaioOutputRow } from "./gaio-ui"

// biome-ignore lint/suspicious/noExplicitAny: canvas steps arrive unparsed from the draft
type AnyStep = { id: string; stepType: StepType } & Record<string, any>

/** Buttons that leave the flow (dial, open another flow) have no next step. */
const BUTTON_TYPES_WITHOUT_OUTPUT: readonly (string | null)[] = [
  buttonTypes.enum.callPhoneNumber,
  buttonTypes.enum.startExternalFlow,
  buttonTypes.enum.startExternalNode,
]

export const GaioButtonRow = ({ button }: { button: ButtonStepProps }) => {
  const hasOutput = !BUTTON_TYPES_WITHOUT_OUTPUT.includes(button.buttonType)
  const icon =
    button.buttonType === buttonTypes.enum.openWebsite ? (
      <LinkIcon aria-label="Link" className="size-3.5 shrink-0 text-primary" />
    ) : button.buttonType === buttonTypes.enum.callPhoneNumber ? (
      <PhoneCallIcon className="size-3.5 shrink-0 text-primary" />
    ) : null

  return (
    <GaioOutputRow
      handleId={hasOutput ? button.id : null}
      icon={icon}
      label={button.label || "Botão"}
    />
  )
}

const GaioText = ({ text }: { text: string }) => {
  const { labelById } = useCouponTopicOptions()
  const couponSubstituted = useMemo(
    () => replaceCouponVariableTokensWithLabels(text ?? "", labelById),
    [text, labelById],
  )
  const previewText = useBotFieldTokenLabels(couponSubstituted)

  return (
    <GaioBox className="whitespace-pre-line">
      {previewText || (
        <span className="text-muted-foreground">Digite sua mensagem...</span>
      )}
    </GaioBox>
  )
}

const ButtonList = ({ buttons }: { buttons?: ButtonStepProps[] }) =>
  buttons && buttons.length > 0 ? (
    <div className="flex flex-col gap-2">
      {buttons.map((button) => (
        <GaioButtonRow button={button} key={button.id} />
      ))}
    </div>
  ) : null

const MEDIA: Partial<
  Record<StepType, { label: string; icon: typeof ImageIcon }>
> = {
  [stepTypes.enum.sendImage]: { label: "Imagem", icon: ImageIcon },
  [stepTypes.enum.sendGif]: { label: "GIF", icon: ImageIcon },
  [stepTypes.enum.sendMultipleImages]: { label: "Galeria", icon: ImageIcon },
  [stepTypes.enum.sendVideo]: { label: "Vídeo", icon: VideoIcon },
  [stepTypes.enum.sendAudio]: { label: "Áudio", icon: Volume2Icon },
  [stepTypes.enum.sendFile]: { label: "PDF / arquivo", icon: FileTextIcon },
}

const isPreviewableImage = (url: unknown): url is string =>
  typeof url === "string" && /^https?:\/\//.test(url) && !url.includes("{{")

const GaioMedia = ({ step }: { step: AnyStep }) => {
  const media = MEDIA[step.stepType]
  if (!media) {
    return null
  }
  const showImage =
    (step.stepType === stepTypes.enum.sendImage ||
      step.stepType === stepTypes.enum.sendGif) &&
    isPreviewableImage(step.url)

  return (
    <div className="flex flex-col gap-2">
      {showImage ? (
        <div className="overflow-hidden rounded-lg bg-muted">
          {/* biome-ignore lint/performance/noImgElement: plain preview of an arbitrary URL */}
          <img
            alt={media.label}
            className="h-36 w-full object-cover"
            draggable={false}
            loading="lazy"
            src={step.url}
          />
        </div>
      ) : (
        <GaioBox className="flex items-center gap-2 py-2.5">
          <media.icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium">{media.label}</span>
        </GaioBox>
      )}
      <ButtonList buttons={step.buttons} />
    </div>
  )
}

const GaioWaitBox = ({ children }: { children: ReactNode }) => (
  <GaioBox className="flex flex-col items-center gap-1 text-center">
    <ClockIcon className="size-5 text-muted-foreground" />
    <p className="text-sm">{children}</p>
  </GaioBox>
)

export const GaioTyping = ({ seconds }: { seconds: number }) => (
  <GaioWaitBox>
    <span className="font-semibold">
      Aguardar {formatDuration(seconds, "seconds")}
    </span>{" "}
    <span className="text-muted-foreground">antes da próxima mensagem</span>
  </GaioWaitBox>
)

export const GaioWait = ({ step }: { step: WaitStepSchema }) => {
  if (step.delayType === waitStepDelayTypes.enum.duration) {
    return (
      <GaioWaitBox>
        <span className="font-semibold">
          Aguardar {formatDuration(step.duration, step.unit)}
        </span>{" "}
        <span className="text-muted-foreground">
          antes do próximo passo
          {step.interval && step.startTime && step.endTime
            ? ` (só entre ${step.startTime.slice(0, 5)} e ${step.endTime.slice(0, 5)})`
            : ""}
        </span>
      </GaioWaitBox>
    )
  }
  if (step.delayType === waitStepDelayTypes.enum.random) {
    return (
      <GaioWaitBox>
        <span className="font-semibold">
          Aguardar entre {step.min} e {formatDuration(step.max, step.unit)}
        </span>{" "}
        <span className="text-muted-foreground">(tempo aleatório)</span>
      </GaioWaitBox>
    )
  }
  return (
    <GaioBox>
      <DynamicStepViewer data={step} type={step.stepType} />
    </GaioBox>
  )
}

const GaioQuestion = ({ step }: { step: GetUserDataStepSchema }) => {
  const customFields = useCustomFields(useWorkspaceId()).data ?? []
  const field = customFields.find(
    (item) => String(item.id) === String(step.outputFieldId),
  )

  return (
    <div className="flex flex-col gap-2">
      <GaioText text={step.message} />
      {field ? (
        <p className="px-1 text-muted-foreground text-xs">
          Resposta salva em{" "}
          <span className="font-medium text-foreground">{field.name}</span>
        </p>
      ) : null}
      {step.states.map((state) => {
        let label = "Respondeu"
        if (state.stateType === stateTypes.skip) {
          label = step.autoSkip
            ? `Sem resposta em ${formatDuration(step.autoSkipTimeValue, step.autoSkipTimeUnit)}`
            : step.skipButtonLabel || "Pular"
        } else if (state.stateType === stateTypes.error) {
          label = "Resposta inválida"
        }
        return (
          <GaioOutputRow
            handleId={state.id}
            key={state.id}
            label={label}
            muted={state.stateType !== stateTypes.success}
          />
        )
      })}
    </div>
  )
}

const GaioTags = ({ step }: { step: AnyStep }) => {
  const tags: string[] = Array.isArray(step.tags) ? step.tags : []
  const isRemove = step.stepType === stepTypes.enum.removeContactTag

  return (
    <GaioBox className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs">
        {isRemove ? "Remover tags:" : "Adicionar tags:"}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <span
              className="rounded-md border bg-card px-2 py-0.5 font-medium text-xs"
              key={tag}
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-xs">
            Nenhuma etiqueta escolhida
          </span>
        )}
      </div>
    </GaioBox>
  )
}

type ConditionRowData =
  ConditionStepSchema["cases"][number]["conditions"][number]

const GaioCondition = ({ step }: { step: ConditionStepSchema }) => {
  const t = useTranslations()
  const { configs, operatorLabelByValue } = useContactFilterConfigs(
    undefined,
    true,
    step.cases.flatMap((conditionCase) => conditionCase.conditions),
    "flowCondition",
  )

  const describe = (condition: ConditionRowData) => {
    const isCustomField = condition.field === "customField"
    const isBotField = condition.field === "botField"
    const fieldConfig = configs.find((config) => {
      if (isCustomField && condition.customFieldId !== undefined) {
        return String(config.customFieldId) === String(condition.customFieldId)
      }
      if (isBotField && condition.botFieldId !== undefined) {
        return String(config.botFieldId) === String(condition.botFieldId)
      }
      return config.name === condition.field
    })
    const fieldLabel =
      fieldConfig?.label ??
      (isCustomField
        ? t("fields.customField.label")
        : isBotField
          ? t("fields.botField.label")
          : t(`condition.fields.${condition.field}`))
    const operatorLabel =
      operatorLabelByValue.get(condition.operator) ?? condition.operator
    const value = formatFilterConditionValue(condition.value, fieldConfig, t)
    return { fieldLabel, operatorLabel, value }
  }

  const single = step.cases.length === 1

  return (
    <div className="flex flex-col gap-2">
      {step.cases.map((conditionCase, caseIndex) => (
        <div className="flex flex-col gap-2" key={conditionCase.id}>
          <GaioBox className="flex flex-col gap-1.5 py-2.5">
            {conditionCase.conditions.map((condition, index) => {
              const { fieldLabel, operatorLabel, value } = describe(condition)
              return (
                <p
                  className="text-sm leading-snug"
                  // biome-ignore lint/suspicious/noArrayIndexKey: rows have no id
                  key={index}
                >
                  {index > 0 ? (
                    <span className="me-1 text-muted-foreground text-xs uppercase">
                      {conditionCase.operator === "or" ? "ou" : "e"}
                    </span>
                  ) : null}
                  <span className="font-semibold">{fieldLabel}</span>{" "}
                  <span className="text-muted-foreground">{operatorLabel}</span>
                  {value ? (
                    <>
                      {" "}
                      <span className="font-semibold">{value}</span>
                    </>
                  ) : null}
                </p>
              )
            })}
          </GaioBox>
          <GaioOutputRow
            handleId={conditionCase.id}
            label={single ? "Sim" : `Condição ${caseIndex + 1}`}
          />
        </div>
      ))}
      <GaioOutputRow handleId={step.otherwiseId} label="Não" muted />
    </div>
  )
}

const GaioSplitTraffic = ({
  step,
  nodeId,
}: {
  step: AnyStep
  nodeId: string
}) => (
  <div className="flex flex-col gap-2">
    {(step.cases ?? []).map((item: { value: number }, index: number) => (
      <GaioOutputRow
        handleId={`${nodeId}-case-${index}`}
        // biome-ignore lint/suspicious/noArrayIndexKey: the handle id is the index
        key={index}
        label={`${item.value}% dos contatos`}
      />
    ))}
  </div>
)

/** One step of a block, drawn the way Gaio draws its content. */
export const GaioStepElement = ({
  step,
  nodeId,
}: {
  step: AnyStep
  nodeId: string
}) => {
  switch (step.stepType) {
    case stepTypes.enum.sendText:
      return (
        <div className="flex flex-col gap-2">
          <GaioText text={step.text} />
          <ButtonList buttons={step.buttons} />
        </div>
      )
    case stepTypes.enum.sendImage:
    case stepTypes.enum.sendGif:
    case stepTypes.enum.sendMultipleImages:
    case stepTypes.enum.sendVideo:
    case stepTypes.enum.sendAudio:
    case stepTypes.enum.sendFile:
      return <GaioMedia step={step} />
    case stepTypes.enum.typing:
      return <GaioTyping seconds={Number(step.seconds ?? 0)} />
    case stepTypes.enum.wait:
      return <GaioWait step={step as unknown as WaitStepSchema} />
    case stepTypes.enum.getUserData:
      return <GaioQuestion step={step as unknown as GetUserDataStepSchema} />
    case stepTypes.enum.addContactTag:
    case stepTypes.enum.removeContactTag:
      return <GaioTags step={step} />
    case stepTypes.enum.condition:
      return <GaioCondition step={step as unknown as ConditionStepSchema} />
    case stepTypes.enum.splitTraffic:
      return <GaioSplitTraffic nodeId={nodeId} step={step} />
    default:
      return (
        <GaioBox className="py-2.5">
          <DynamicStepViewer data={step} nodeId={nodeId} type={step.stepType} />
        </GaioBox>
      )
  }
}
