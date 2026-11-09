import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/livechat).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("inbox")
  return null
}
