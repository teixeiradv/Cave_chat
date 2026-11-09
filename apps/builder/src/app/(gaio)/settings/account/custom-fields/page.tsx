import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/settings/account/custom-fields).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("custom-fields")
  return null
}
