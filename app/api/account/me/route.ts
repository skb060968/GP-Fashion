import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"

/** GET /api/account/me → { user } or { user: null } */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  return NextResponse.json({ user })
}

const schema = z.object({
  name: z.string().trim().max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number")
    .or(z.literal(""))
    .optional(),
})

/** PATCH /api/account/me { name?, phone? } */
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 })
  }
  const { name, phone } = parsed.data
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined ? { name: name || null } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
    },
    select: { id: true, email: true, name: true, phone: true },
  })
  return NextResponse.json({ user: updated })
}
