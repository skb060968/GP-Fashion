import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"

const itemSchema = z.object({
  slug: z.string().min(1).max(100),
  size: z.string().min(1).max(10),
  name: z.string().min(1).max(200),
  price: z.number().int().nonnegative(),
  coverThumbnail: z.string().min(1).max(500),
  quantity: z.number().int().min(1).max(10),
})
const bodySchema = z.object({ items: z.array(itemSchema).max(100) })

const select = { slug: true, size: true, name: true, price: true, coverThumbnail: true, quantity: true } as const

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const items = await prisma.bagItem.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "asc" }, select })
  return NextResponse.json({ items })
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid bag" }, { status: 400 })

  const map = new Map<string, z.infer<typeof itemSchema>>()
  for (const i of parsed.data.items) {
    const k = `${i.slug}|${i.size}`
    const prev = map.get(k)
    map.set(k, prev ? { ...prev, quantity: Math.min(10, prev.quantity + i.quantity) } : i)
  }
  const items = [...map.values()]

  await prisma.$transaction([
    prisma.bagItem.deleteMany({ where: { userId: user.id } }),
    ...(items.length ? [prisma.bagItem.createMany({ data: items.map((i) => ({ ...i, userId: user.id })) })] : []),
  ])
  return NextResponse.json({ ok: true, count: items.length })
}
