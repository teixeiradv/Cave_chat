import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/settings/account/integrations).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("settings/integrations")
  return null
}
