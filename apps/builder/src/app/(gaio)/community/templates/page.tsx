import { redirectToWorkspacePage } from "@/lib/gaio-redirect"

export const dynamic = "force-dynamic"

// CaveChat: a Comunidade saiu do menu; o link antigo leva ao painel Geral.
export default async function GaioRedirectPage() {
  await redirectToWorkspacePage("dashboard")
  return null
}
