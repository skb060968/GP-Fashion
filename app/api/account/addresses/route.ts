import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"
import { userAddressSchema } from "@/lib/validation/schemas"

const MAX_ADDRESSES = 10

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const addresses = await prisma.userAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })
  return NextResponse.json({ addresses })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const parsed = userAddressSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json({ error: first?.message ?? "Invalid address", field: first?.path[0] }, { status: 400 })
  }

  const count = await prisma.userAddress.count({ where: { userId: user.id } })
  if (count >= MAX_ADDRESSES) {
    return NextResponse.json({ error: `You can save up to ${MAX_ADDRESSES} addresses.` }, { status: 400 })
  }

  const { isDefault, ...data } = parsed.data
  const makeDefault = isDefault || count === 0

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.userAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } })
    return tx.userAddress.create({
      data: { ...data, addressLine2: data.addressLine2 || null, label: data.label || null, isDefault: makeDefault, userId: user.id },
    })
  })
  return NextResponse.json({ address }, { status: 201 })
}
