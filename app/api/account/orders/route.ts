import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"

/**
 * GET /api/account/orders
 * Orders placed while signed in, plus guest orders that used the same email.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: user.id }, { address: { is: { email: { equals: user.email, mode: "insensitive" } } } }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      orderCode: true,
      amount: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
      items: { select: { id: true, name: true, size: true, quantity: true, price: true, coverThumbnail: true, slug: true } },
    },
  })

  return NextResponse.json({ orders })
}
