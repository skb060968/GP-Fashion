import { NextResponse, type NextRequest } from "next/server"
import { requireAdminMutation } from "@/lib/security/adminAuth"
import { ChallanError, issueChallan } from "@/lib/services/jobWorkService"
import { challanCreateSchema } from "@/lib/validation/schemas"

export async function POST(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const { orderId } = await context.params
    const parsed = challanCreateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the challan details" }, { status: 400 })
    }
    try {
      const updated = await issueChallan(orderId, parsed.data)
      if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 })
      return NextResponse.json(updated)
    } catch (err) {
      if (err instanceof ChallanError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("ADMIN CHALLAN CREATE ERROR:", error)
    return NextResponse.json({ error: "Failed to issue the challan" }, { status: 500 })
  }
}
