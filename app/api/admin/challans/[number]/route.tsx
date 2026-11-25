import { NextResponse, type NextRequest } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth"
import { challanFileName, challanFromSlug } from "@/lib/jobwork/challan"
import { ChallanError, cancelChallan, receiveChallan } from "@/lib/services/jobWorkService"
import { challanUpdateSchema } from "@/lib/validation/schemas"
import ChallanDocument from "@/lib/pdf/ChallanDocument"

export const runtime = "nodejs"

export async function GET(req: NextRequest, context: { params: Promise<{ number: string }> }) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  try {
    const { number: slug } = await context.params
    const number = challanFromSlug(slug)
    const challan = number
      ? await prisma.jobWorkChallan.findUnique({ where: { number }, include: { lines: true, order: { select: { orderCode: true } } } })
      : null
    if (!challan) return NextResponse.json({ error: "Challan not found" }, { status: 404 })
    const pdf = await renderToBuffer(<ChallanDocument challan={challan} />)
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${challanFileName(challan.number)}.pdf"`,
        "Content-Length": String(pdf.byteLength),
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    console.error("CHALLAN_PDF_ERROR:", error)
    return NextResponse.json({ error: "Failed to generate the challan" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ number: string }> }) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const { number: slug } = await context.params
    const number = challanFromSlug(slug)
    if (!number) return NextResponse.json({ error: "Challan not found" }, { status: 404 })
    const parsed = challanUpdateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 })
    try {
      const d = parsed.data
      const updated = d.action === "received" ? await receiveChallan(number, d) : await cancelChallan(number, d.reason)
      return NextResponse.json(updated)
    } catch (err) {
      if (err instanceof ChallanError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("CHALLAN_UPDATE_ERROR:", error)
    return NextResponse.json({ error: "Failed to update the challan" }, { status: 500 })
  }
}
