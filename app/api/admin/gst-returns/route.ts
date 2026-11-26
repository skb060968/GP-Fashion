import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth"
import { ReturnsError, gstReturnAlerts, gstReturns, returnYears, saveFiling } from "@/lib/services/gstReturnsService"
import { gstFilingSchema } from "@/lib/validation/schemas"

const noStore = { "Cache-Control": "private, no-store" }

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  try {
    const { searchParams } = new URL(req.url)
    if (searchParams.get("alerts") === "1") return NextResponse.json({ alerts: await gstReturnAlerts() }, { headers: noStore })
    const years = returnYears()
    const fy = Number(searchParams.get("fy") ?? years[0])
    if (!years.includes(fy)) return NextResponse.json({ error: "Choose a financial year from the list" }, { status: 400 })
    return NextResponse.json(await gstReturns(fy), { headers: noStore })
  } catch (error) {
    console.error("ADMIN GST RETURNS ERROR:", error)
    return NextResponse.json({ error: "Failed to load the GST returns" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const parsed = gstFilingSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 })
    try {
      return NextResponse.json(await saveFiling(parsed.data))
    } catch (err) {
      if (err instanceof ReturnsError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("ADMIN GST FILING ERROR:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
