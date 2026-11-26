import { NextResponse, type NextRequest } from "next/server"
import { requireAdminMutation } from "@/lib/security/adminAuth"
import { PurchaseError, deleteGstr2b, importGstr2b } from "@/lib/services/purchaseService"
import { gstr2bUploadSchema } from "@/lib/validation/schemas"

export async function POST(req: NextRequest) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const parsed = gstr2bUploadSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Choose the GSTR-2B JSON file" }, { status: 400 })
    try {
      return NextResponse.json(await importGstr2b(parsed.data.fileName ?? "", parsed.data.content))
    } catch (err) {
      if (err instanceof PurchaseError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("ADMIN GSTR2B IMPORT ERROR:", error)
    return NextResponse.json({ error: "Failed to read the GSTR-2B file" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const period = new URL(req.url).searchParams.get("period") ?? ""
    if (!/^\d{4}-\d{2}$/.test(period)) return NextResponse.json({ error: "Choose the GSTR-2B to remove" }, { status: 400 })
    try {
      await deleteGstr2b(period)
      return NextResponse.json({ ok: true })
    } catch (err) {
      if (err instanceof PurchaseError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }
  } catch (error) {
    console.error("ADMIN GSTR2B DELETE ERROR:", error)
    return NextResponse.json({ error: "Failed to remove the GSTR-2B" }, { status: 500 })
  }
}
