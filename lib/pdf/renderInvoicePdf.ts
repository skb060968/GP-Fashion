import React from "react"
import path from "path"
import fs from "fs"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoiceDocument, type InvoiceDocumentProps } from "./InvoiceDocument"

export async function renderInvoicePdf(
  order: InvoiceDocumentProps["order"]
): Promise<Buffer> {
  let logoSrc = ""
  try {
    const logoPath = path.join(process.cwd(), "public", "payments", "logo.png")
    const logoBuffer = fs.readFileSync(logoPath)
    logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`
  } catch {
    // Logo missing — render PDF without it
  }

  const buffer = await renderToBuffer(
    React.createElement(InvoiceDocument, { order, logoSrc })
  )
  return Buffer.from(buffer)
}
