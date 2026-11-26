import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth"
import { currentFyStart, type Quarter } from "@/lib/gst/period"
import { PurchaseError, createPurchase, listPurchases } from "@/lib/services/purchaseService"
import { returnYears } from "@/lib/services/gstReturnsService"
import { purchaseSchema } from "@/lib/validation/schemas"

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  try {
    const { searchParams } = new URL(req.url)
    const years = returnYears()
    const fy = Number(searchParams.get("fy") ?? currentFyStart())
    const q = searchParams.get("q") ?? "all"
    if (!Number.isInteger(fy) || fy < 2017 || fy > currentFyStart()) return NextResponse.json({ error: "Choose a financial year from the list" }, { status: 400 })
    if (!["1", "2", "3", "4", "all"].includes(q)) return NextResponse.json({ error: "Choose a quarter from the list" }, { status: 400 })
    const data = await listPurchases(fy, q === "all" ? null : (Number(q) as Quarter))
    return NextResponse.json({ ...data, years: years.includes(fy) ? years : [fy, ...years].sort((a, b) => b - a) }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("ADMIN PURCHASES ERROR:", error)
    return NextResponse.json({ error: "Failed to load the purchases" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const parsed = purchaseSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the entry" }, { status: 400 })
    try {
      return NextResponse.json(await createPurchase(parsed.data), { status: 201 })
    } catch (err) {
      if (err instanceof PurchaseError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("ADMIN PURCHASE CREATE ERROR:", error)
    return NextResponse.json({ error: "Failed to save the entry" }, { status: 500 })
  }
}
