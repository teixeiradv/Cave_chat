import type { Metadata } from "next"
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from "../contact"

export const metadata: Metadata = { title: "Exclusão de dados · CaveChat" }

export default function DataDeletionPage() {
  return (
    <>
      <h1>Exclusão de dados</h1>
      <p>Última atualização: {LEGAL_UPDATED_AT}</p>
      <p>
        Você pode pedir a exclusão dos seus dados do CaveChat a qualquer
        momento.
      </p>

      <h2>Se você conectou uma conta ao CaveChat</h2>
      <ul>
        <li>
          Dentro do CaveChat, desconecte o canal (Instagram, Facebook ou
          WhatsApp) nas configurações do espaço de trabalho. Os dados ligados a
          ele são apagados.
        </li>
        <li>
          Você também pode remover o acesso pela própria Meta: no Facebook, vá
          em Configurações e privacidade › Configurações › Integrações
          comerciais; no Instagram, em Configurações › Apps e sites. Remova o
          CaveChat.
        </li>
      </ul>

      <h2>Se você conversou com uma conta atendida pelo CaveChat</h2>
      <p>
        Envie um e-mail para{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> com
        o assunto “Exclusão de dados” e o seu @ ou número usado na conversa.
        Apagamos as mensagens e os dados do seu perfil em até 30 dias e
        confirmamos por e-mail.
      </p>
    </>
  )
}
