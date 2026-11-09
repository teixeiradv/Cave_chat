import { resolveLocale } from "@/i18n/config"
import { messagesByLocale } from "@/i18n/messages"

export function loadWorkspaceMessages(_language: string) {
  // CaveChat: public workspace pages are always pt-BR.
  const locale = resolveLocale("pt-BR")
  return { locale, messages: messagesByLocale[locale] }
}
