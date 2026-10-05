import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"
import { userAddressSchema } from "@/lib/validation/schemas"

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const { id } = await params

  const existing = await prisma.userAddress.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 })

  const parsed = userAddressSchema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return NextResponse.json({ error: first?.message ?? "Invalid address", field: first?.path[0] }, { status: 400 })
  }
  const { isDefault, ...data } = parsed.data

  const address = await prisma.$transaction(async (tx) => {
    if (isDefault) await tx.userAddress.updateMany({ where: { userId: user.id }, data: { isDefault: false } })
    return tx.userAddress.update({
      where: { id },
      data: { ...data, addressLine2: data.addressLine2 || null, label: data.label || null, ...(isDefault ? { isDefault: true } : {}) },
    })
  })
  return NextResponse.json({ address })
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  const { id } = await params

  const existing = await prisma.userAddress.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.userAddress.delete({ where: { id } })
    if (existing.isDefault) {
      const next = await tx.userAddress.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } })
      if (next) await tx.userAddress.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  })
  return NextResponse.json({ success: true })
}
