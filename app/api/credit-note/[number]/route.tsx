import { NextResponse, type NextRequest } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import CreditNoteDocument from "@/lib/pdf/CreditNoteDocument"
import { creditNoteFileName, creditNoteFromSlug } from "@/lib/gst/creditNote"
import { canReadOrder } from "@/lib/security/orderAccess"

export const runtime = "nodejs"

export async function GET(req: NextRequest, context: { params: Promise<{ number: string }> }) {
  try {
    const { number: slug } = await context.params
    const number = creditNoteFromSlug(slug)
    const creditNote = number
      ? await prisma.creditNote.findUnique({
          where: { number },
          include: { items: true, order: { select: { orderCode: true, userId: true, address: true } } },
        })
      : null

    const order = creditNote?.order
    if (!creditNote || !order || !(await canReadOrder(req, order.orderCode, { userId: order.userId, email: order.address?.email ?? null }))) {
      return NextResponse.json({ error: "Credit note not found" }, { status: 404 })
    }

    const pdf = await renderToBuffer(<CreditNoteDocument creditNote={creditNote} />)

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${creditNoteFileName(creditNote.number)}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("CREDIT_NOTE_PDF_ERROR:", error)
    return NextResponse.json({ error: "Failed to generate the credit note" }, { status: 500 })
  }
}
