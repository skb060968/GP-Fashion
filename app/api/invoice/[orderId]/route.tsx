import { NextResponse, type NextRequest } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import InvoiceDocument from "@/lib/pdf/InvoiceDocument"
import { canReadOrder } from "@/lib/security/orderAccess"

export const runtime = "nodejs"

export async function GET(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params

    const orderCode = orderId.replace(/\.pdf$/i, "")

    const order = await prisma.order.findUnique({
      where: { orderCode },
      include: { address: true, items: true },
    })

    if (!order || !(await canReadOrder(req, order.orderCode, { userId: order.userId, email: order.address?.email ?? null }))) {
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
