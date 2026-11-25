import { NextResponse, type NextRequest } from "next/server"
import { requireAdminMutation } from "@/lib/security/adminAuth"
import { updateTailor } from "@/lib/services/jobWorkService"
import { formatZodErrors, tailorSchema } from "@/lib/validation/schemas"

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const { id } = await context.params
    const parsed = tailorSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details", fields: formatZodErrors(parsed.error) }, { status: 400 })
    }
    const updated = await updateTailor(id, parsed.data)
    if (!updated) return NextResponse.json({ error: "Tailor not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("ADMIN TAILOR UPDATE ERROR:", error)
    return NextResponse.json({ error: "Failed to save the tailor" }, { status: 500 })
  }
}
