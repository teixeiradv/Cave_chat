import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/settings/account/channels).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("settings/channels")
  return null
}
