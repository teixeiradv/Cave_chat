import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/general).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("dashboard")
  return null
}
