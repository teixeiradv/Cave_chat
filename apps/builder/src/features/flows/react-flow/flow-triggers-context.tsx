"use client"

import { createContext, useContext } from "react"

/**
 * What starts this automation, shown in the Gaio-style "Gatilho" block at the
 * start of the canvas. In CaveChat a trigger is not part of the flow: an
 * Instagram comment automation points its private reply at the flow, so the
 * flow page loads the ones that point here.
 */
export type FlowTrigger = {
  id: string
  name: string
  isActive: boolean
  postType: string
  postCount: number
  keywordType: string
  keywords: string[]
  publicReplies: number
}

type FlowTriggersValue = {
  workspaceId: string
  triggers: FlowTrigger[]
}

const FlowTriggersContext = createContext<FlowTriggersValue | null>(null)

export const FlowTriggersProvider = FlowTriggersContext.Provider

export const useFlowTriggers = () => useContext(FlowTriggersContext)
