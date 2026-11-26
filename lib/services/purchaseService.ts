import { Prisma } from "@prisma/client"
import { prisma } from "../prisma"
import { business } from "../data/business"
import { recordPeriod, type Quarter } from "../gst/period"
import { registrationDate } from "../gst/returns"
import { addHeads, zeroHeads, type Heads } from "../gst/taxHeads"
import { PurchaseError, checkPurchase, periodMonths, purchaseCost, purchaseTotal, sumItc, type PurchaseInput } from "../purchases/purchases"
import { matchGstr2b, parseGstr2b, type Gstr2bDoc, type ImportDocs } from "../purchases/gstr2b"

export { PurchaseError }

export type PurchaseLinks = { orderCode?: string; challanNumber?: string }

const registeredOn = () => registrationDate(business.gstRegisteredOn)

const purchaseSelect = {
  id: true, kind: true, category: true, date: true, supplierName: true, supplierGstin: true, supplierStateCode: true,
  billNumber: true, billKey: true, description: true, taxableValue: true, igst: true, cgst: true, sgst: true, claimItc: true, note: true,
  order: { select: { orderCode: true } }, challan: { select: { number: true } },
} as const

async function resolveLinks(links: PurchaseLinks) {
  const orderCode = links.orderCode?.trim().toUpperCase() || ""
  const challanNumber = links.challanNumber?.trim() || ""
  if (challanNumber) {
    const challan = await prisma.jobWorkChallan.findUnique({ where: { number: challanNumber }, select: { id: true, orderId: true, order: { select: { orderCode: true } } } })
    if (!challan) throw new PurchaseError(`Challan ${challanNumber} not found`)
    if (orderCode && challan.order.orderCode !== orderCode) throw new PurchaseError(`Challan ${challanNumber} is for order ${challan.order.orderCode}, not ${orderCode}`)
    return { orderId: challan.orderId, challanId: challan.id }
  }
  if (orderCode) {
    const order = await prisma.order.findUnique({ where: { orderCode }, select: { id: true } })
    if (!order) throw new PurchaseError(`Order ${orderCode} not found`)
    return { orderId: order.id, challanId: null }
  }
  return { orderId: null, challanId: null }
}

async function prepare(input: PurchaseInput & PurchaseLinks, id: string | null) {
  const record = checkPurchase(input, business.stateCode, registeredOn())
  if (record.supplierGstin && record.billKey) {
    const dup = await prisma.purchase.findFirst({
      where: { kind: record.kind, supplierGstin: record.supplierGstin, billKey: record.billKey, ...(id ? { NOT: { id } } : {}) },
      select: { date: true, billNumber: true },
    })
    if (dup) throw new PurchaseError(`Bill ${dup.billNumber} from this supplier is already in the register`, 409)
  }
  return { ...record, ...(await resolveLinks(input)) }
}

export async function createPurchase(input: PurchaseInput & PurchaseLinks) {
  return prisma.purchase.create({ data: await prepare(input, null), select: purchaseSelect })
}

export async function updatePurchase(id: string, input: PurchaseInput & PurchaseLinks) {
  const exists = await prisma.purchase.findUnique({ where: { id }, select: { id: true } })
  if (!exists) throw new PurchaseError("Entry not found", 404)
  return prisma.purchase.update({ where: { id }, data: await prepare(input, id), select: purchaseSelect })
}

export async function deletePurchase(id: string) {
  const r = await prisma.purchase.deleteMany({ where: { id } })
  if (r.count === 0) throw new PurchaseError("Entry not found", 404)
}

async function loadMatch() {
  const [register, imports] = await Promise.all([
    prisma.purchase.findMany({
      where: { kind: { in: ["BILL", "CREDIT_NOTE"] } },
      select: { id: true, kind: true, supplierGstin: true, billKey: true, taxableValue: true, igst: true, cgst: true, sgst: true, claimItc: true },
    }),
    prisma.gstr2bImport.findMany({ orderBy: { period: "asc" } }),
  ])
  const docs: ImportDocs[] = imports.map((i) => ({ period: i.period, docs: i.docs as unknown as Gstr2bDoc[] }))
  return { match: matchGstr2b(register, docs), imports }
}

export type ItcSuggestion = { register: Heads; registerBills: number; gstr2b: Heads | null; gstr2bPeriods: string[] }

export async function itcContext(from: Date, to: Date) {
  const [bills, { match, imports }] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: { gte: from, lt: to }, kind: { in: ["BILL", "CREDIT_NOTE"] }, claimItc: true },
      select: { date: true, kind: true, taxableValue: true, igst: true, cgst: true, sgst: true, claimItc: true },
    }),
    loadMatch(),
  ])
  return (start: Date, end: Date): ItcSuggestion => {
    const inRange = bills.filter((b) => b.date >= start && b.date < end)
    const months = new Set(periodMonths(start, end))
    const periods = imports.map((i) => i.period).filter((p) => months.has(p))
    const gstr2b = periods.length ? periods.reduce((t, p) => addHeads(t, match.itcByPeriod.get(p) ?? zeroHeads()), zeroHeads()) : null
    return { register: sumItc(inRange), registerBills: inRange.length, gstr2b, gstr2bPeriods: periods }
  }
}

export async function listPurchases(fyStart: number, quarter: Quarter | null) {
  const period = recordPeriod(fyStart, quarter)
  const [rows, { match, imports }] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: period.from, lt: period.to } }, orderBy: [{ date: "asc" }, { createdAt: "asc" }], select: purchaseSelect }),
    loadMatch(),
  ])
  const months = new Set(periodMonths(period.from, period.to))
  const purchases = rows.map((p) => {
    const m = match.entries.get(p.id)
    return {
      ...p,
      orderCode: p.order?.orderCode ?? null,
      challanNumber: p.challan?.number ?? null,
      total: purchaseTotal(p),
      cost: purchaseCost(p),
      match: m ? { status: m.status, period: m.period, doc: m.doc } : { status: "noCredit" as const, period: null, doc: null },
    }
  })
  const imp = imports.filter((i) => months.has(i.period))
  return {
    period: { ...period, from: period.from.toISOString(), to: period.to.toISOString() },
    gstin: business.gstin,
    purchases,
    summary: {
      bills: purchases.filter((p) => p.kind !== "NO_GST").length,
      expenses: purchases.filter((p) => p.kind === "NO_GST").length,
      itcInRegister: sumItc(purchases),
      itcMatched: imp.reduce((t, i) => addHeads(t, match.itcByPeriod.get(i.period) ?? zeroHeads()), zeroHeads()),
      total: purchases.reduce((n, p) => n + p.total, 0),
      cost: purchases.reduce((n, p) => n + p.cost, 0),
    },
    imports: imp.map((i) => ({ period: i.period, generatedOn: i.generatedOn, fileName: i.fileName, importedAt: i.importedAt, docs: (i.docs as unknown as Gstr2bDoc[]).length, other: i.other })),
    notInRegister: match.unmatched.filter((d) => months.has(d.period)),
  }
}

export async function importGstr2b(fileName: string, text: string) {
  const file = parseGstr2b(text, business.gstin)
  const data = { gstin: file.gstin, generatedOn: file.generatedOn, fileName: fileName.slice(0, 120) || null, docs: file.docs as unknown as Prisma.InputJsonValue, other: file.other as unknown as Prisma.InputJsonValue, importedAt: new Date() }
  await prisma.gstr2bImport.upsert({ where: { period: file.period }, create: { period: file.period, ...data }, update: data })
  return { period: file.period, docs: file.docs.length, other: file.other }
}

export async function deleteGstr2b(period: string) {
  const r = await prisma.gstr2bImport.deleteMany({ where: { period } })
  if (r.count === 0) throw new PurchaseError("No GSTR-2B for that period", 404)
}

export async function purchasesForRecords(from: Date, to: Date) {
  return prisma.purchase.findMany({ where: { date: { gte: from, lt: to } }, orderBy: [{ date: "asc" }, { createdAt: "asc" }], select: purchaseSelect })
}
