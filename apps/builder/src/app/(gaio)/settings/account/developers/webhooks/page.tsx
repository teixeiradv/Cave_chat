import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/settings/account/developers/webhooks).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("webhooks")
  return null
}
