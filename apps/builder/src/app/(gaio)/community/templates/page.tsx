import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/community/templates).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("tools")
  return null
}
