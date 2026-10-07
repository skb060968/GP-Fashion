

import { OrderStatus, PaymentMethod, type Prisma } from "@prisma/client"

export type OrderListFilters = {
  search: string
  status: OrderStatus | null
  paymentMethod: PaymentMethod | null
  from: Date | null
  to: Date | null
}

export function parseOrderFilters(searchParams: URLSearchParams): OrderListFilters {
  const search = (searchParams.get("search") ?? "").trim()
  const statusRaw = searchParams.get("status") ?? ""
  const payRaw = searchParams.get("paymentMethod") ?? ""
  const fromRaw = searchParams.get("from") ?? ""
  const toRaw = searchParams.get("to") ?? ""

  const status = (Object.values(OrderStatus) as string[]).includes(statusRaw) ? (statusRaw as OrderStatus) : null
  const paymentMethod = (Object.values(PaymentMethod) as string[]).includes(payRaw) ? (payRaw as PaymentMethod) : null

  const from = /^\d{4}-\d{2}-\d{2}$/.test(fromRaw) ? new Date(`${fromRaw}T00:00:00+05:30`) : null
  const to = /^\d{4}-\d{2}-\d{2}$/.test(toRaw) ? new Date(`${toRaw}T23:59:59.999+05:30`) : null

  return { search, status, paymentMethod, from, to }
}

export function buildOrderWhere(f: OrderListFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {}

  if (f.search) {
    where.OR = [
      { orderCode: { contains: f.search, mode: "insensitive" } },
      { address: { is: { fullName: { contains: f.search, mode: "insensitive" } } } },
      { address: { is: { phone: { contains: f.search } } } },
      { address: { is: { email: { contains: f.search, mode: "insensitive" } } } },
    ]
  }
  if (f.status) where.status = f.status
  if (f.paymentMethod) where.paymentMethod = f.paymentMethod
  if (f.from || f.to) {
    where.createdAt = {
      ...(f.from ? { gte: f.from } : {}),
      ...(f.to ? { lte: f.to } : {}),
    }
  }
  return where
}
