import { NextResponse, type NextRequest } from "next/server"
import { requireAdminMutation } from "@/lib/security/adminAuth"
import { PurchaseError, deletePurchase, updatePurchase } from "@/lib/services/purchaseService"
import { purchaseSchema } from "@/lib/validation/schemas"

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const { id } = await context.params
    const parsed = purchaseSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the entry" }, { status: 400 })
    try {
      return NextResponse.json(await updatePurchase(id, parsed.data))
    } catch (err) {
      if (err instanceof PurchaseError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("ADMIN PURCHASE UPDATE ERROR:", error)
    return NextResponse.json({ error: "Failed to save the entry" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const { id } = await context.params
    try {
      await deletePurchase(id)
      return NextResponse.json({ ok: true })
    } catch (err) {
      if (err instanceof PurchaseError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("ADMIN PURCHASE DELETE ERROR:", error)
    return NextResponse.json({ error: "Failed to delete the entry" }, { status: 500 })
  }
}
