import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/assistant).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("ai-agents")
  return null
}
