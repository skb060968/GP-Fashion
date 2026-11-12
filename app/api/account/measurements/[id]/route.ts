import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"
import { parseProfileBody, toProfileDTO } from "@/lib/measurements/profiles"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const { id } = await params

  const existing = await prisma.measurementProfile.findFirst({ where: { id, userId: user.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: "Measurements not found" }, { status: 404 })

  const parsed = parseProfileBody(await req.json().catch(() => ({})))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 })

  const profile = await prisma.measurementProfile.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ profile: toProfileDTO(profile) })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const { id } = await params

  const deleted = await prisma.measurementProfile.deleteMany({ where: { id, userId: user.id } })
  if (deleted.count === 0) return NextResponse.json({ error: "Measurements not found" }, { status: 404 })
  return NextResponse.json({ success: true })
}
