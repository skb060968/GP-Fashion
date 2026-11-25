import { NextResponse, type NextRequest } from "next/server"
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth"
import { createTailor, listTailors } from "@/lib/services/jobWorkService"
import { formatZodErrors, tailorSchema } from "@/lib/validation/schemas"

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  try {
    return NextResponse.json(await listTailors(), { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("ADMIN TAILORS ERROR:", error)
    return NextResponse.json({ error: "Failed to load the tailors" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdminMutation(req)
  if (denied) return denied
  try {
    const parsed = tailorSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the details", fields: formatZodErrors(parsed.error) }, { status: 400 })
    }
    return NextResponse.json(await createTailor(parsed.data), { status: 201 })
  } catch (error) {
    console.error("ADMIN TAILOR CREATE ERROR:", error)
    return NextResponse.json({ error: "Failed to save the tailor" }, { status: 500 })
  }
}
