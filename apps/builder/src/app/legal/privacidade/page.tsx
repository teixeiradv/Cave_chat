import type { Metadata } from "next"
import { LEGAL_CONTACT_EMAIL, LEGAL_UPDATED_AT } from "../contact"

export const metadata: Metadata = { title: "Política de privacidade · CaveChat" }

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Política de privacidade</h1>
      <p>Última atualização: {LEGAL_UPDATED_AT}</p>
      <p>
        O CaveChat é uma plataforma de automação de mensagens e atendimento
        usada por criadores e empresas para responder pessoas no Instagram,
        Facebook Messenger, WhatsApp e outros canais. Esta política explica
        quais dados tratamos, para quê e quais são os seus direitos, conforme a
        Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
      </p>

      <h2>Dados que tratamos</h2>
      <ul>
        <li>
          Dados da conta de quem usa o CaveChat: nome, e-mail e dados de
          acesso.
        </li>
        <li>
          Dados das contas conectadas (Instagram, Facebook, WhatsApp): o
          identificador e o nome da conta ou página, e o token de acesso
          concedido pela própria plataforma (Meta), guardado de forma
          criptografada.
        </li>
        <li>
          Dados das pessoas que conversam com essas contas: nome público,
          identificador do perfil, foto de perfil, as mensagens e comentários
          enviados e as respostas das automações.
        </li>
      </ul>

      <h2>Para que usamos</h2>
      <ul>
        <li>Receber e responder mensagens e comentários automaticamente.</li>
        <li>
          Mostrar as conversas na caixa de entrada para atendimento humano.
        </li>
        <li>Gerar métricas de uso das automações para o dono da conta.</li>
      </ul>
      <p>
        Não vendemos dados pessoais e não usamos as conversas para publicidade.
        Os dados só são compartilhados com os provedores necessários para o
        serviço funcionar (por exemplo, a Meta, para enviar e receber
        mensagens, e a infraestrutura de hospedagem).
      </p>

      <h2>Por quanto tempo guardamos</h2>
      <p>
        Os dados ficam guardados enquanto a conta conectada estiver ativa no
        CaveChat. Ao desconectar um canal ou excluir a conta, os dados ligados a
        ele são apagados.
      </p>

      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer
        momento. Veja como em <a href="/legal/exclusao-de-dados">Exclusão de
        dados</a> ou escreva para{" "}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </>
  )
}
