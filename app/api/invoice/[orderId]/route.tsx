import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import InvoiceDocument from "@/lib/pdf/InvoiceDocument"

export const runtime = "nodejs"

/**
 * GET /api/invoice/<orderCode>
 * Streams the order's invoice as a PDF download.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params
    // Strip an optional ".pdf" suffix so /api/invoice/26040.pdf also works.
    const orderCode = orderId.replace(/\.pdf$/i, "")

    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { address: true, items: true },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const pdf = await renderToBuffer(<InvoiceDocument order={order} />)

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.orderCode}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("INVOICE_PDF_ERROR:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
