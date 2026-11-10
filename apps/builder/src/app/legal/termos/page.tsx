import type { Metadata } from "next"
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from "../contact"

export const metadata: Metadata = { title: "Termos de uso · CaveChat" }

export default function TermsPage() {
  return (
    <>
      <h1>Termos de uso</h1>
      <p>Última atualização: {LEGAL_UPDATED_AT}</p>
      <p>
        Ao usar o CaveChat você concorda com estes termos. O CaveChat permite
        conectar contas do Instagram, Facebook Messenger, WhatsApp e outros
        canais para criar automações de mensagens e atender pessoas.
      </p>

      <h2>Uso permitido</h2>
      <ul>
        <li>
          Conecte apenas contas que você administra ou que tem autorização para
          usar.
        </li>
        <li>
          Siga as regras de cada plataforma (Termos e Políticas da Meta,
          Política de Mensagens do WhatsApp Business e similares).
        </li>
        <li>
          Não use o CaveChat para spam, golpes, conteúdo ilegal ou mensagens
          que as pessoas não pediram.
        </li>
      </ul>

      <h2>Sua conta</h2>
      <p>
        Você é responsável pelas automações que cria, pelo conteúdo enviado e
        por manter seus dados de acesso em segurança. Podemos suspender contas
        que violem estes termos ou as regras das plataformas conectadas.
      </p>

      <h2>Disponibilidade</h2>
      <p>
        Trabalhamos para manter o serviço no ar, mas ele depende de serviços de
        terceiros (como a Meta) e pode ter interrupções. Mudanças nas
        plataformas podem alterar ou limitar recursos.
      </p>

      <h2>Contato</h2>
      <p>
        Dúvidas sobre estes termos:{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </>
  )
}
