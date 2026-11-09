import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/campaigns).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("broadcasts")
  return null
}
