import { Prisma } from "@prisma/client"
import { prisma } from "../prisma"
import { sellerSnapshot } from "../data/business"
import { financialYear } from "../gst/tax"
import {
  ChallanError,
  ISSUE_STATUSES,
  challanLines,
  challanNumber,
  challanPieces,
  challanSeries,
  challanStatus,
  receivedDate,
  type LineInput,
} from "../jobwork/challan"
import { challanItems } from "../jobwork/items"
import { orderInclude } from "./orderStatusService"

export { ChallanError }

export type TailorInput = {
  name: string
  phone?: string
  addressLine1: string
  addressLine2?: string
  city: string
  stateCode: string
  pincode: string
  gstin?: string
  active?: boolean
}

const tailorData = (t: TailorInput) => ({
  name: t.name.trim(),
  phone: t.phone?.trim() || null,
  addressLine1: t.addressLine1.trim(),
  addressLine2: t.addressLine2?.trim() || null,
  city: t.city.trim(),
  stateCode: t.stateCode,
  pincode: t.pincode.trim(),
  gstin: t.gstin?.trim() || null,
})

export const tailorAddress = (t: { addressLine1: string; addressLine2: string | null; city: string; pincode: string }) =>
  [t.addressLine1, t.addressLine2, `${t.city} ${t.pincode}`].filter(Boolean).join("\n")

export async function listTailors() {
  const [tailors, open] = await Promise.all([
    prisma.tailor.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], include: { _count: { select: { challans: true } } } }),
    prisma.jobWorkChallan.findMany({
      where: { receivedAt: null, cancelledAt: null },
      orderBy: { date: "asc" },
      select: { number: true, date: true, tailorName: true, tailorId: true, pieces: true, receivedAt: true, cancelledAt: true, order: { select: { orderCode: true, status: true } } },
    }),
  ])
  return { tailors, open }
}

export async function createTailor(input: TailorInput) {
  return prisma.tailor.create({ data: { ...tailorData(input), active: input.active ?? true } })
}

export async function updateTailor(id: string, input: TailorInput) {
  const exists = await prisma.tailor.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return null
  return prisma.tailor.update({ where: { id }, data: { ...tailorData(input), ...(input.active === undefined ? {} : { active: input.active }) } })
}

export type ChallanRequest = {
  tailorId: string
  pieces: { orderItemId: string; quantity: number }[]
  lines: LineInput[]
  fabricBill?: string
  ewayBill?: string
  note?: string
}

export async function issueChallan(orderCode: string, request: ChallanRequest) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderCode },
      include: { items: true, challans: { select: { number: true, pieces: true, receivedAt: true, cancelledAt: true } } },
    })
    if (!order) return null
    if (!(ISSUE_STATUSES as readonly string[]).includes(order.status)) {
      throw new ChallanError("Start processing the order before sending fabric to a tailor", 409)
    }
    const tailor = await tx.tailor.findUnique({ where: { id: request.tailorId } })
    if (!tailor) throw new ChallanError("Choose a tailor from the list", 404)
    if (!tailor.active) throw new ChallanError(`${tailor.name} is marked inactive. Make them active on the Tailors page first.`, 409)

    const pieces = challanPieces(challanItems(order.items), order.challans, request.pieces)
    const { lines, taxableValue, taxAmount } = challanLines(request.lines)

    const now = new Date()
    const series = challanSeries(financialYear(now))
    const counter = await tx.invoiceCounter.upsert({
      where: { financialYear: series },
      create: { financialYear: series, last: 1 },
      update: { last: { increment: 1 } },
    })
    await tx.jobWorkChallan.create({
      data: {
        number: challanNumber(financialYear(now), counter.last),
        date: now,
        pieces: pieces as unknown as Prisma.InputJsonValue,
        taxableValue,
        taxAmount,
        fabricBill: request.fabricBill?.trim() || null,
        ewayBill: request.ewayBill?.trim() || null,
        note: request.note?.trim() || null,
        tailorName: tailor.name,
        tailorAddress: tailorAddress(tailor),
        tailorStateCode: tailor.stateCode,
        tailorGstin: tailor.gstin,
        tailorPhone: tailor.phone,
        ...sellerSnapshot(),
        orderId: order.id,
        tailorId: tailor.id,
        lines: { create: lines },
      },
    })
    return tx.order.findUnique({ where: { id: order.id }, include: orderInclude })
  })
}

async function findChallan(tx: Prisma.TransactionClient, number: string) {
  const challan = await tx.jobWorkChallan.findUnique({ where: { number }, select: { id: true, number: true, date: true, receivedAt: true, cancelledAt: true, orderId: true } })
  if (!challan) throw new ChallanError("Challan not found", 404)
  return challan
}

export async function receiveChallan(number: string, input: { date: string; note: string; ewayBill?: string }) {
  return prisma.$transaction(async (tx) => {
    const challan = await findChallan(tx, number)
    const status = challanStatus(challan)
    if (status === "cancelled") throw new ChallanError(`Challan ${number} was cancelled`, 409)
    if (status === "received") throw new ChallanError(`Challan ${number} is already marked received back`, 409)
    const note = input.note.trim()
    if (!note) throw new ChallanError("Write what came back, as the tailor endorsed it on the challan")
    const receivedAt = receivedDate(input.date, challan.date)
    const moved = await tx.jobWorkChallan.updateMany({
      where: { id: challan.id, receivedAt: null, cancelledAt: null },
      data: { receivedAt, receivedNote: note, receivedEwayBill: input.ewayBill?.trim() || null },
    })
    if (moved.count === 0) throw new ChallanError("This challan was just updated. Refresh the page and try again.", 409)
    return tx.order.findUnique({ where: { id: challan.orderId }, include: orderInclude })
  })
}

export async function cancelChallan(number: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const challan = await findChallan(tx, number)
    if (challanStatus(challan) !== "open") throw new ChallanError("Only a challan that is still with the tailor can be cancelled", 409)
    const text = reason.trim()
    if (!text) throw new ChallanError("Give a reason for cancelling the challan")
    const moved = await tx.jobWorkChallan.updateMany({
      where: { id: challan.id, receivedAt: null, cancelledAt: null },
      data: { cancelledAt: new Date(), cancelReason: text },
    })
    if (moved.count === 0) throw new ChallanError("This challan was just updated. Refresh the page and try again.", 409)
    return tx.order.findUnique({ where: { id: challan.orderId }, include: orderInclude })
  })
}
