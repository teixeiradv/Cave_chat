"use client"

import { cn } from "@chatbotx.io/ui/lib/utils"
import { Position } from "@xyflow/react"
import type { ReactNode } from "react"
import { BaseHandle } from "@/components/base-handle"

/**
 * Building blocks of the Gaio-style blocks drawn on the flow canvas: the grey
 * content boxes, the output rows (one handle per button / outcome) and the
 * "Próximo passo" footer. Handles keep the ids the engine already routes by, so
 * only the look changes.
 */

export const GaioBox = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <div
    className={cn(
      "wrap-anywhere rounded-lg bg-muted px-4 py-3 text-foreground text-sm",
      className,
    )}
  >
    {children}
  </div>
)

export const GaioOutputRow = ({
  handleId,
  label,
  icon,
  muted,
  dashed,
  children,
}: {
  /** No handle when the row does not continue the flow (e.g. a call button). */
  handleId?: string | null
  label: ReactNode
  icon?: ReactNode
  muted?: boolean
  dashed?: boolean
  children?: ReactNode
}) => (
  <div
    className={cn(
      "relative flex min-h-9 items-center gap-2 rounded-lg border bg-card py-1.5 ps-3 text-sm",
      handleId ? "pe-8" : "pe-3",
      dashed && "border-dashed",
      muted ? "text-muted-foreground" : "font-medium",
    )}
  >
    {icon}
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {children}
    {handleId ? (
      // React Flow routes from the physical right side of the row.
      <BaseHandle
        className="right-3!"
        id={handleId}
        onConnectedClassName="bg-primary! border-primary!"
        position={Position.Right}
        type="source"
      />
    ) : null}
  </div>
)

export const GaioNextStep = ({ nodeId }: { nodeId: string }) => (
  <div className="relative flex items-center justify-end border-t py-2 ps-4 pe-8 text-muted-foreground text-xs">
    Próximo passo
    <BaseHandle
      className="right-3!"
      id={nodeId}
      onConnectedClassName="bg-primary! border-primary!"
      position={Position.Right}
      type="source"
    />
  </div>
)

export const InstagramBadge = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-linear-to-tr from-amber-400 via-pink-500 to-purple-600 text-white",
      className,
    )}
  >
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect height="18" rx="5" width="18" x="3" y="3" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" fill="currentColor" r="0.6" />
    </svg>
  </span>
)

export const IconBadge = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <span
    className={cn(
      "inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary [&_svg]:size-4",
      className,
    )}
  >
    {children}
  </span>
)

const UNIT_LABELS: Record<string, [string, string]> = {
  seconds: ["segundo", "segundos"],
  minutes: ["minuto", "minutos"],
  hours: ["hora", "horas"],
  days: ["dia", "dias"],
}

/** "50 minutos", "1 hora" — Gaio's wording for a duration. */
export const formatDuration = (
  value: number | string | null | undefined,
  unit: string | null | undefined,
) => {
  const amount = Number(value ?? 0)
  const labels = UNIT_LABELS[unit ?? ""]
  if (!labels) {
    return `${amount} ${unit ?? ""}`.trim()
  }
  return `${amount} ${amount === 1 ? labels[0] : labels[1]}`
}
