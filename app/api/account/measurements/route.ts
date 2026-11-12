import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"
import { MAX_PROFILES, parseProfileBody, toProfileDTO } from "@/lib/measurements/profiles"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const profiles = await prisma.measurementProfile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ profiles: profiles.map(toProfileDTO) })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = parseProfileBody(await req.json().catch(() => ({})))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, field: parsed.field }, { status: 400 })

  const count = await prisma.measurementProfile.count({ where: { userId: user.id } })
  if (count >= MAX_PROFILES) {
    return NextResponse.json({ error: `You can save up to ${MAX_PROFILES} measurement profiles.` }, { status: 400 })
  }

  const profile = await prisma.measurementProfile.create({ data: { ...parsed.data, userId: user.id } })
  return NextResponse.json({ profile: toProfileDTO(profile) }, { status: 201 })
}
