import { renderToBuffer } from "@react-pdf/renderer"
import { InvoiceDocument, type InvoiceDocumentProps } from "./InvoiceDocument"

export async function renderInvoicePdf(
  order: InvoiceDocumentProps["order"],
  siteUrl?: string
): Promise<Buffer> {
  // Use the site URL to fetch the logo — works on both local and Vercel
  const baseUrl = siteUrl || process.env.SITE_URL || "http://localhost:3000"
  let logoSrc = ""
  try {
    const res = await fetch(`${baseUrl}/payments/logo.png`)
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer()
      logoSrc = `data:image/png;base64,${Buffer.from(arrayBuffer).toString("base64")}`
    }
  } catch {
    // Logo fetch failed — render PDF without it
  }

  const buffer = await renderToBuffer(
    <InvoiceDocument order={order} logoSrc={logoSrc} />
  )
  return Buffer.from(buffer)
}
