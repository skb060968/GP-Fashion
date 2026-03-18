import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderInvoicePdf } from "@/lib/pdf/renderInvoicePdf"

// Allow up to 30 seconds for PDF generation on Vercel
export const maxDuration = 30

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    const order = await prisma.order.findUnique({
      where: { orderCode: orderId },
      include: { address: true, items: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    const pdfBuffer = await renderInvoicePdf(order as any)

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${order.orderCode}.pdf"`,
      },
    })
  } catch (error) {
    console.error("❌ INVOICE PDF ERROR:", error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}
