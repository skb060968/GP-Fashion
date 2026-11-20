import { escapeCsvField } from "@/lib/admin/csvExport"
import { adminStatusLabel } from "@/lib/orders/labels"
import { placeOfSupplyLabel } from "./states"
import { IST_OFFSET_MS, type RecordPeriod } from "./period"

export const B2CL_LIMIT = 100000 * 100
export const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

const HSN_SHORT: Record<string, string> = {
  "6203": "Men's suits and trousers",
  "6204": "Women's suits and dresses",
  "6205": "Men's shirts",
  "6206": "Women's blouses and shirts",
}

export type RecordItem = {
  hsn: string
  gstRate: number
  quantity: number
  taxableValue: number
  taxAmount: number
}

export type RecordInvoice = {
  orderCode: string
  invoiceNumber: string
  invoiceDate: Date | string
  amount: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  placeOfSupply: string
  buyerGstin: string | null
  buyerName: string | null
  customerName: string | null
  sellerGstin: string | null
  sellerStateCode: string | null
  status: string
  items: RecordItem[]
}

export type Gstr1Table = "B2B" | "B2CL" | "B2CS"

export type RecordSummary = {
  invoices: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  total: number
  tables: Record<Gstr1Table, number>
}

export function invoiceSequence(invoiceNumber: string): number {
  const n = Number(invoiceNumber.split("/").pop())
  return Number.isFinite(n) ? n : 0
}

export function istDate(d: Date | string): string {
  const ist = new Date(new Date(d).getTime() + IST_OFFSET_MS)
  const dd = String(ist.getUTCDate()).padStart(2, "0")
  const mm = String(ist.getUTCMonth() + 1).padStart(2, "0")
  return `${dd}-${mm}-${ist.getUTCFullYear()}`
}

const rupees = (paise: number) => Math.round(paise) / 100

export function gstr1Table(inv: RecordInvoice, sellerStateCode: string): Gstr1Table {
  if (inv.buyerGstin && GSTIN_PATTERN.test(inv.buyerGstin)) return "B2B"
  if (inv.placeOfSupply !== sellerStateCode && inv.amount > B2CL_LIMIT) return "B2CL"
  return "B2CS"
}

type TaxParts = { txval: number; iamt: number; camt: number; samt: number }

function lineParts(item: RecordItem, intra: boolean): TaxParts {
  const camt = intra ? Math.round(item.taxAmount / 2) : 0
  return {
    txval: item.taxableValue,
    iamt: intra ? 0 : item.taxAmount,
    camt,
    samt: intra ? item.taxAmount - camt : 0,
  }
}

function addParts(into: TaxParts, p: TaxParts) {
  into.txval += p.txval
  into.iamt += p.iamt
  into.camt += p.camt
  into.samt += p.samt
}

const zero = (): TaxParts => ({ txval: 0, iamt: 0, camt: 0, samt: 0 })

function taxFields(p: TaxParts, intra: boolean) {
  return intra
    ? { txval: rupees(p.txval), camt: rupees(p.camt), samt: rupees(p.samt), csamt: 0 }
    : { txval: rupees(p.txval), iamt: rupees(p.iamt), csamt: 0 }
}

function byRate(inv: RecordInvoice, intra: boolean) {
  const rates = new Map<number, TaxParts>()
  for (const item of inv.items) {
    const parts = rates.get(item.gstRate) ?? zero()
    addParts(parts, lineParts(item, intra))
    rates.set(item.gstRate, parts)
  }
  return [...rates.entries()].sort((a, b) => a[0] - b[0])
}

export function sortInvoices<T extends { invoiceNumber: string }>(invoices: T[]): T[] {
  return [...invoices].sort((a, b) => invoiceSequence(a.invoiceNumber) - invoiceSequence(b.invoiceNumber))
}

export function summarise(invoices: RecordInvoice[], sellerStateCode: string): RecordSummary {
  const tables: Record<Gstr1Table, number> = { B2B: 0, B2CL: 0, B2CS: 0 }
  const s = { invoices: invoices.length, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0, tables }
  for (const inv of invoices) {
    s.taxableValue += inv.taxableValue
    s.cgst += inv.cgst
    s.sgst += inv.sgst
    s.igst += inv.igst
    s.total += inv.amount
    tables[gstr1Table(inv, inv.sellerStateCode ?? sellerStateCode)] += 1
  }
  return s
}

const REFUND_STATUSES = new Set(["RETURN_RECEIVED", "REFUNDED"])

export function recordWarnings(invoices: RecordInvoice[], sellerGstin: string): string[] {
  const warnings: string[] = []
  const other = invoices.filter((inv) => inv.sellerGstin !== sellerGstin)
  if (other.length) {
    warnings.push(
      `${other.length === 1 ? "1 invoice was" : `${other.length} invoices were`} issued under another GSTIN (${other.map((i) => i.invoiceNumber).join(", ")}) and ${other.length === 1 ? "is" : "are"} left out of the GSTR-1 file.`
    )
  }
  for (const inv of invoices) {
    if (REFUND_STATUSES.has(inv.status)) {
      warnings.push(
        `${inv.invoiceNumber} (order ${inv.orderCode}) is now ${adminStatusLabel(inv.status)}. The invoice stays in this GSTR-1; a refund needs a credit note, reported in the return for the period of the refund. The site does not create credit notes.`
      )
    }
  }
  const own = sortInvoices(invoices.filter((inv) => inv.sellerGstin === sellerGstin))
  for (let i = 1; i < own.length; i++) {
    const a = invoiceSequence(own[i - 1].invoiceNumber), b = invoiceSequence(own[i].invoiceNumber)
    if (b !== a + 1) warnings.push(`Invoice numbers jump from ${own[i - 1].invoiceNumber} to ${own[i].invoiceNumber}.`)
  }
  return warnings
}

export function buildGstr1(invoices: RecordInvoice[], period: RecordPeriod, sellerGstin: string, sellerStateCode: string) {
  if (!period.fp) throw new Error("GSTR-1 is prepared for a quarter")
  const own = sortInvoices(invoices.filter((inv) => inv.sellerGstin === sellerGstin))

  const b2b = new Map<string, unknown[]>()
  const b2cl = new Map<string, unknown[]>()
  const b2cs = new Map<string, { sply_ty: string; pos: string; rt: number; parts: TaxParts }>()
  const hsn = { B2B: new Map<string, { hsn: string; rt: number; qty: number; parts: TaxParts }>(), B2C: new Map<string, { hsn: string; rt: number; qty: number; parts: TaxParts }>() }

  for (const inv of own) {
    const state = inv.sellerStateCode ?? sellerStateCode
    const intra = inv.placeOfSupply === state
    const table = gstr1Table(inv, state)
    const rates = byRate(inv, intra)
    const head = { inum: inv.invoiceNumber, idt: istDate(inv.invoiceDate), val: rupees(inv.amount) }

    if (table === "B2B") {
      const list = b2b.get(inv.buyerGstin!) ?? []
      list.push({
        ...head,
        pos: inv.placeOfSupply,
        rchrg: "N",
        inv_typ: "R",
        itms: rates.map(([rt, p], i) => ({ num: i + 1, itm_det: { rt, ...taxFields(p, intra) } })),
      })
      b2b.set(inv.buyerGstin!, list)
    } else if (table === "B2CL") {
      const list = b2cl.get(inv.placeOfSupply) ?? []
      list.push({ ...head, itms: rates.map(([rt, p], i) => ({ num: i + 1, itm_det: { rt, ...taxFields(p, false) } })) })
      b2cl.set(inv.placeOfSupply, list)
    } else {
      for (const [rt, p] of rates) {
        const key = `${intra ? "INTRA" : "INTER"}|${inv.placeOfSupply}|${rt}`
        const row = b2cs.get(key) ?? { sply_ty: intra ? "INTRA" : "INTER", pos: inv.placeOfSupply, rt, parts: zero() }
        addParts(row.parts, p)
        b2cs.set(key, row)
      }
    }

    const hsnList = table === "B2B" ? hsn.B2B : hsn.B2C
    for (const item of inv.items) {
      const key = `${item.hsn}|${item.gstRate}`
      const row = hsnList.get(key) ?? { hsn: item.hsn, rt: item.gstRate, qty: 0, parts: zero() }
      row.qty += item.quantity
      addParts(row.parts, lineParts(item, intra))
      hsnList.set(key, row)
    }
  }

  const hsnRows = (list: Map<string, { hsn: string; rt: number; qty: number; parts: TaxParts }>) =>
    [...list.values()]
      .sort((a, b) => a.hsn.localeCompare(b.hsn) || a.rt - b.rt)
      .map((r, i) => ({
        num: i + 1,
        hsn_sc: r.hsn,
        desc: (HSN_SHORT[r.hsn] ?? "").slice(0, 30),
        uqc: "PCS",
        qty: r.qty,
        rt: r.rt,
        txval: rupees(r.parts.txval),
        iamt: rupees(r.parts.iamt),
        camt: rupees(r.parts.camt),
        samt: rupees(r.parts.samt),
        csamt: 0,
      }))

  const json: Record<string, unknown> = { gstin: sellerGstin, fp: period.fp, version: "GST3.0.4", hash: "hash" }
  if (b2b.size) json.b2b = [...b2b.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([ctin, inv]) => ({ ctin, inv }))
  if (b2cl.size) json.b2cl = [...b2cl.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([pos, inv]) => ({ pos, inv }))
  if (b2cs.size) {
    json.b2cs = [...b2cs.values()]
      .sort((a, b) => a.pos.localeCompare(b.pos) || a.rt - b.rt)
      .map((r) => ({ sply_ty: r.sply_ty, pos: r.pos, typ: "OE", rt: r.rt, ...taxFields(r.parts, r.sply_ty === "INTRA") }))
  }
  const hsnB2b = hsnRows(hsn.B2B), hsnB2c = hsnRows(hsn.B2C)
  if (hsnB2b.length || hsnB2c.length) {
    json.hsn = { ...(hsnB2b.length ? { hsn_b2b: hsnB2b } : {}), ...(hsnB2c.length ? { hsn_b2c: hsnB2c } : {}) }
  }
  if (own.length) {
    const first = own[0], last = own[own.length - 1]
    const totnum = invoiceSequence(last.invoiceNumber) - invoiceSequence(first.invoiceNumber) + 1
    json.doc_issue = {
      doc_det: [
        {
          doc_num: 1,
          docs: [{ num: 1, from: first.invoiceNumber, to: last.invoiceNumber, totnum, cancel: totnum - own.length, net_issue: own.length }],
        },
      ],
    }
  }
  return { json, invoices: own.length }
}

export const REGISTER_COLUMNS = [
  "Invoice number",
  "Invoice date",
  "Order",
  "Customer",
  "Buyer GSTIN",
  "Buyer business name",
  "Place of supply",
  "GSTR-1 table",
  "Taxable value",
  "CGST",
  "SGST",
  "IGST",
  "Invoice value",
  "Status now",
] as const

export function invoiceRegisterCsv(invoices: RecordInvoice[], sellerStateCode: string): string {
  const money = (p: number) => (p / 100).toFixed(2)
  const sorted = sortInvoices(invoices)
  const rows = sorted.map((inv) =>
    [
      inv.invoiceNumber,
      istDate(inv.invoiceDate),
      inv.orderCode,
      inv.customerName ?? "",
      inv.buyerGstin ?? "",
      inv.buyerName ?? "",
      placeOfSupplyLabel(inv.placeOfSupply),
      gstr1Table(inv, inv.sellerStateCode ?? sellerStateCode),
      money(inv.taxableValue),
      money(inv.cgst),
      money(inv.sgst),
      money(inv.igst),
      money(inv.amount),
      adminStatusLabel(inv.status),
    ]
      .map(escapeCsvField)
      .join(",")
  )
  const s = summarise(sorted, sellerStateCode)
  const total = ["Total", "", "", `${s.invoices} invoices`, "", "", "", "", money(s.taxableValue), money(s.cgst), money(s.sgst), money(s.igst), money(s.total), ""]
  return [REGISTER_COLUMNS.join(","), ...rows, total.map(escapeCsvField).join(",")].join("\n") + "\n"
}
