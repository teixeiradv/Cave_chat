import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: rota no formato da Gaio (/contacts/ranking).
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("contacts")
  return null
}
