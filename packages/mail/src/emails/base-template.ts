export type BaseEmailProps = {
  brandName: string
  brandLogoUrl: string
  brandUrl: string
  subject: string
}

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function buildSystemEmail(
  props: BaseEmailProps,
  bodyMjml: string,
): string {
  const { brandName, brandLogoUrl, brandUrl, subject } = props

  return `
<mjml>
  <mj-head>
    <mj-preview>${esc(subject)}</mj-preview>
    <mj-attributes>
      <mj-all font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif" />
      <mj-text font-size="16px" color="#3c3f44" line-height="24px" />
      <mj-button background-color="#ea1b2d" color="#ffffff" font-size="14px" font-weight="700" border-radius="4px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#ffffff">
    <mj-section background-color="#0a0a0b" border-radius="8px" padding="16px 20px">
      <mj-group>
        <mj-column width="56px" vertical-align="middle">
          <mj-image width="40px" padding="0" src="${esc(brandLogoUrl)}" alt="${esc(brandName)}" href="${esc(brandUrl)}" align="left" />
        </mj-column>
        <mj-column vertical-align="middle">
          <mj-text padding="0" font-size="22px" font-weight="700" color="#ffffff" line-height="28px">${esc(brandName)}</mj-text>
        </mj-column>
      </mj-group>
    </mj-section>
    <mj-section padding="16px 0 8px 0">
      <mj-column>
        <mj-text font-size="28px" font-weight="700" color="#1d1c1d" line-height="36px" padding="0">
          ${esc(subject)}
        </mj-text>
      </mj-column>
    </mj-section>
    ${bodyMjml}
    <mj-section padding="16px 0 32px 0">
      <mj-column>
        <mj-text padding="0">Até logo,</mj-text>
        <mj-text padding="0">Equipe ${esc(brandName)}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`
}
