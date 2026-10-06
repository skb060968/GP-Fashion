import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"

const itemSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  price: z.number().int().nonnegative(),
  coverThumbnail: z.string().min(1).max(500),
  coverImage: z.string().max(500).optional(),
  sizes: z.array(z.string().max(10)).max(20),
})
const bodySchema = z.object({ items: z.array(itemSchema).max(200) })

const select = { slug: true, name: true, price: true, coverThumbnail: true, coverImage: true, sizes: true } as const

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const items = await prisma.wishlistItem.findMany({ where: { userId: user.id }, orderBy: { addedAt: "asc" }, select })
  return NextResponse.json({ items: items.map((i) => ({ ...i, coverImage: i.coverImage ?? undefined })) })
}

/** PUT replaces the whole list with the client's current state. */
export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid wishlist" }, { status: 400 })

  // De-duplicate by slug, keeping the first occurrence.
  const seen = new Set<string>()
  const items = parsed.data.items.filter((i) => (seen.has(i.slug) ? false : (seen.add(i.slug), true)))

  await prisma.$transaction([
    prisma.wishlistItem.deleteMany({ where: { userId: user.id } }),
    ...(items.length
      ? [prisma.wishlistItem.createMany({ data: items.map((i) => ({ ...i, coverImage: i.coverImage ?? null, userId: user.id })) })]
      : []),
  ])
  return NextResponse.json({ ok: true, count: items.length })
}
