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
  creditNotes?: string[]
  items: RecordItem[]
}

export type RecordCreditNote = {
  number: string
  date: Date | string
  reason: string
  orderCode: string
  invoiceNumber: string
  invoiceDate: Date | string
  invoiceAmount: number
  amount: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  placeOfSupply: string
  buyerGstin: string | null
  buyerName: string | null
  customerName: string | null
  sellerGstin: string
  sellerStateCode: string
  items: RecordItem[]
}

export type Gstr1Table = "B2B" | "B2CL" | "B2CS"

type Totals = { taxableValue: number; cgst: number; sgst: number; igst: number; total: number }

export type RecordSummary = Totals & {
  invoices: number
  tables: Record<Gstr1Table, number>
  creditNotes: number
  credited: Totals
  net: Totals
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

export function gstr1Table(inv: { buyerGstin: string | null; placeOfSupply: string; amount: number }, sellerStateCode: string): Gstr1Table {
  if (inv.buyerGstin && GSTIN_PATTERN.test(inv.buyerGstin)) return "B2B"
  if (inv.placeOfSupply !== sellerStateCode && inv.amount > B2CL_LIMIT) return "B2CL"
  return "B2CS"
}

export function creditNoteTable(cn: RecordCreditNote): Gstr1Table {
  return gstr1Table({ buyerGstin: cn.buyerGstin, placeOfSupply: cn.placeOfSupply, amount: cn.invoiceAmount }, cn.sellerStateCode)
}

const CN_TABLE_LABEL: Record<Gstr1Table, string> = {
  B2B: "Credit notes, registered (9B)",
  B2CL: "Credit notes, unregistered (9B)",
  B2CS: "Taken off B2C small (7)",
}

type TaxParts = { txval: number; iamt: number; camt: number; samt: number }

function lineParts(item: RecordItem, intra: boolean, sign = 1): TaxParts {
  const camt = intra ? Math.round(item.taxAmount / 2) : 0
  return {
    txval: sign * item.taxableValue,
    iamt: sign * (intra ? 0 : item.taxAmount),
    camt: sign * camt,
    samt: sign * (intra ? item.taxAmount - camt : 0),
  }
}

function addParts(into: TaxParts, p: TaxParts) {
  into.txval += p.txval
  into.iamt += p.iamt
  into.camt += p.camt
  into.samt += p.samt
}

const zero = (): TaxParts => ({ txval: 0, iamt: 0, camt: 0, samt: 0 })
const isZero = (p: TaxParts) => p.txval === 0 && p.iamt === 0 && p.camt === 0 && p.samt === 0
const isNegative = (p: TaxParts) => p.txval < 0 || p.iamt < 0 || p.camt < 0 || p.samt < 0

function taxFields(p: TaxParts, intra: boolean) {
  return intra
    ? { txval: rupees(p.txval), camt: rupees(p.camt), samt: rupees(p.samt), csamt: 0 }
    : { txval: rupees(p.txval), iamt: rupees(p.iamt), csamt: 0 }
}

function byRate(items: RecordItem[], intra: boolean) {
  const rates = new Map<number, TaxParts>()
  for (const item of items) {
    const parts = rates.get(item.gstRate) ?? zero()
    addParts(parts, lineParts(item, intra))
    rates.set(item.gstRate, parts)
  }
  return [...rates.entries()].sort((a, b) => a[0] - b[0])
}

export function sortInvoices<T extends { invoiceNumber: string }>(invoices: T[]): T[] {
  return [...invoices].sort((a, b) => invoiceSequence(a.invoiceNumber) - invoiceSequence(b.invoiceNumber))
}

export function sortCreditNotes<T extends { number: string }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => invoiceSequence(a.number) - invoiceSequence(b.number))
}

const emptyTotals = (): Totals => ({ taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 })

function addTotals(t: Totals, d: { taxableValue: number; cgst: number; sgst: number; igst: number; amount: number }) {
  t.taxableValue += d.taxableValue
  t.cgst += d.cgst
  t.sgst += d.sgst
  t.igst += d.igst
  t.total += d.amount
}

export function summarise(invoices: RecordInvoice[], sellerStateCode: string, creditNotes: RecordCreditNote[] = []): RecordSummary {
  const tables: Record<Gstr1Table, number> = { B2B: 0, B2CL: 0, B2CS: 0 }
  const gross = emptyTotals(), credited = emptyTotals()
  for (const inv of invoices) {
    addTotals(gross, inv)
    tables[gstr1Table(inv, inv.sellerStateCode ?? sellerStateCode)] += 1
  }
  for (const cn of creditNotes) addTotals(credited, cn)
  const net = {
    taxableValue: gross.taxableValue - credited.taxableValue,
    cgst: gross.cgst - credited.cgst,
    sgst: gross.sgst - credited.sgst,
    igst: gross.igst - credited.igst,
    total: gross.total - credited.total,
  }
  return { invoices: invoices.length, ...gross, tables, creditNotes: creditNotes.length, credited, net }
}

export function recordWarnings(invoices: RecordInvoice[], sellerGstin: string, creditNotes: RecordCreditNote[] = []): string[] {
  const warnings: string[] = []
  const other = invoices.filter((inv) => inv.sellerGstin !== sellerGstin)
  if (other.length) {
    warnings.push(
      `${other.length === 1 ? "1 invoice was" : `${other.length} invoices were`} issued under another GSTIN (${other.map((i) => i.invoiceNumber).join(", ")}) and ${other.length === 1 ? "is" : "are"} left out of the GSTR-1 file.`
    )
  }
  const otherCn = creditNotes.filter((cn) => cn.sellerGstin !== sellerGstin)
  if (otherCn.length) warnings.push(`Credit notes issued under another GSTIN (${otherCn.map((c) => c.number).join(", ")}) are left out of the GSTR-1 file.`)
  for (const inv of invoices) {
    const credited = inv.creditNotes?.length ?? 0
    if (inv.status === "RETURN_RECEIVED" && !credited) {
      warnings.push(`${inv.invoiceNumber} (order ${inv.orderCode}): the return has been received. Marking it refunded issues the credit note, which goes in the GSTR-1 of the quarter it is issued in.`)
    } else if (inv.status === "REFUNDED" && !credited) {
      warnings.push(`${inv.invoiceNumber} (order ${inv.orderCode}) was refunded without a credit note, so the GST on it is not reduced.`)
    }
  }
  const own = sortInvoices(invoices.filter((inv) => inv.sellerGstin === sellerGstin))
  for (let i = 1; i < own.length; i++) {
    const a = invoiceSequence(own[i - 1].invoiceNumber), b = invoiceSequence(own[i].invoiceNumber)
    if (b !== a + 1) warnings.push(`Invoice numbers jump from ${own[i - 1].invoiceNumber} to ${own[i].invoiceNumber}.`)
  }
  const ownCn = sortCreditNotes(creditNotes.filter((cn) => cn.sellerGstin === sellerGstin))
  for (let i = 1; i < ownCn.length; i++) {
    const a = invoiceSequence(ownCn[i - 1].number), b = invoiceSequence(ownCn[i].number)
    if (b !== a + 1) warnings.push(`Credit note numbers jump from ${ownCn[i - 1].number} to ${ownCn[i].number}.`)
  }
  return warnings
}

type HsnRow = { hsn: string; rt: number; qty: number; parts: TaxParts }

function docRange(doc_num: number, numbers: string[]) {
  const first = numbers[0], last = numbers[numbers.length - 1]
  const totnum = invoiceSequence(last) - invoiceSequence(first) + 1
  return { doc_num, docs: [{ num: 1, from: first, to: last, totnum, cancel: totnum - numbers.length, net_issue: numbers.length }] }
}

export function buildGstr1(
  invoices: RecordInvoice[],
  period: RecordPeriod,
  sellerGstin: string,
  sellerStateCode: string,
  creditNotes: RecordCreditNote[] = []
) {
  if (!period.fp) throw new Error("GSTR-1 is prepared for a quarter")
  const own = sortInvoices(invoices.filter((inv) => inv.sellerGstin === sellerGstin))
  const ownCn = sortCreditNotes(creditNotes.filter((cn) => cn.sellerGstin === sellerGstin))
  const warnings: string[] = []

  const b2b = new Map<string, unknown[]>()
  const b2cl = new Map<string, unknown[]>()
  const b2cs = new Map<string, { sply_ty: string; pos: string; rt: number; parts: TaxParts }>()
  const cdnr = new Map<string, unknown[]>()
  const cdnur: unknown[] = []
  const hsn = { B2B: new Map<string, HsnRow>(), B2C: new Map<string, HsnRow>() }

  const addB2cs = (pos: string, intra: boolean, rt: number, p: TaxParts) => {
    const key = `${intra ? "INTRA" : "INTER"}|${pos}|${rt}`
    const row = b2cs.get(key) ?? { sply_ty: intra ? "INTRA" : "INTER", pos, rt, parts: zero() }
    addParts(row.parts, p)
    b2cs.set(key, row)
  }
  const addHsn = (table: Gstr1Table, items: RecordItem[], intra: boolean, sign: number) => {
    const list = table === "B2B" ? hsn.B2B : hsn.B2C
    for (const item of items) {
      const key = `${item.hsn}|${item.gstRate}`
      const row = list.get(key) ?? { hsn: item.hsn, rt: item.gstRate, qty: 0, parts: zero() }
      row.qty += sign * item.quantity
      addParts(row.parts, lineParts(item, intra, sign))
      list.set(key, row)
    }
  }
  const itms = (rates: [number, TaxParts][], intra: boolean) => rates.map(([rt, p], i) => ({ num: i + 1, itm_det: { rt, ...taxFields(p, intra) } }))

  for (const inv of own) {
    const state = inv.sellerStateCode ?? sellerStateCode
    const intra = inv.placeOfSupply === state
    const table = gstr1Table(inv, state)
    const rates = byRate(inv.items, intra)
    const head = { inum: inv.invoiceNumber, idt: istDate(inv.invoiceDate), val: rupees(inv.amount) }

    if (table === "B2B") {
      const list = b2b.get(inv.buyerGstin!) ?? []
      list.push({ ...head, pos: inv.placeOfSupply, rchrg: "N", inv_typ: "R", itms: itms(rates, intra) })
      b2b.set(inv.buyerGstin!, list)
    } else if (table === "B2CL") {
      const list = b2cl.get(inv.placeOfSupply) ?? []
      list.push({ ...head, itms: itms(rates, false) })
      b2cl.set(inv.placeOfSupply, list)
    } else {
      for (const [rt, p] of rates) addB2cs(inv.placeOfSupply, intra, rt, p)
    }
    addHsn(table, inv.items, intra, 1)
  }

  for (const cn of ownCn) {
    const intra = cn.placeOfSupply === cn.sellerStateCode
    const table = creditNoteTable(cn)
    const rates = byRate(cn.items, intra)
    const head = { ntty: "C", nt_num: cn.number, nt_dt: istDate(cn.date), val: rupees(cn.amount), pos: cn.placeOfSupply }

    if (table === "B2B") {
      const list = cdnr.get(cn.buyerGstin!) ?? []
      list.push({ ...head, rchrg: "N", inv_typ: "R", itms: itms(rates, intra) })
      cdnr.set(cn.buyerGstin!, list)
    } else if (table === "B2CL") {
      cdnur.push({ typ: "B2CL", ...head, itms: itms(rates, false) })
    } else {
      for (const [rt, p] of rates) addB2cs(cn.placeOfSupply, intra, rt, { txval: -p.txval, iamt: -p.iamt, camt: -p.camt, samt: -p.samt })
    }
    addHsn(table, cn.items, intra, -1)
  }

  const b2csRows = [...b2cs.values()]
    .filter((r) => !isZero(r.parts))
    .filter((r) => {
      if (!isNegative(r.parts)) return true
      warnings.push(
        `Credit notes to ${placeOfSupplyLabel(r.pos)} at ${r.rt}% come to more than this quarter's sales there (taxable value ${rupees(-r.parts.txval).toFixed(2)} below zero). The portal does not take a negative B2C small row, so it is left out of the file: enter the reduction in B2C small on the portal by hand, or ask your CA.`
      )
      return false
    })
    .sort((a, b) => a.pos.localeCompare(b.pos) || a.rt - b.rt)

  const hsnRows = (list: Map<string, HsnRow>, label: string) =>
    [...list.values()]
      .filter((r) => !(isZero(r.parts) && r.qty === 0))
      .filter((r) => {
        if (!isNegative(r.parts) && r.qty >= 0) return true
        warnings.push(`The ${label} HSN summary for ${r.hsn} at ${r.rt}% comes out below zero after credit notes, so it is left out of the file: enter it on the portal by hand.`)
        return false
      })
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
  if (b2csRows.length) {
    json.b2cs = b2csRows.map((r) => ({ sply_ty: r.sply_ty, pos: r.pos, typ: "OE", rt: r.rt, ...taxFields(r.parts, r.sply_ty === "INTRA") }))
  }
  if (cdnr.size) json.cdnr = [...cdnr.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([ctin, nt]) => ({ ctin, nt }))
  if (cdnur.length) json.cdnur = cdnur
  const hsnB2b = hsnRows(hsn.B2B, "B2B"), hsnB2c = hsnRows(hsn.B2C, "B2C")
  if (hsnB2b.length || hsnB2c.length) {
    json.hsn = { ...(hsnB2b.length ? { hsn_b2b: hsnB2b } : {}), ...(hsnB2c.length ? { hsn_b2c: hsnB2c } : {}) }
  }
  const docDet = []
  if (own.length) docDet.push(docRange(1, own.map((i) => i.invoiceNumber)))
  if (ownCn.length) docDet.push(docRange(5, ownCn.map((c) => c.number)))
  if (docDet.length) json.doc_issue = { doc_det: docDet }
  return { json, invoices: own.length, creditNotes: ownCn.length, warnings }
}

const money = (p: number) => (p / 100).toFixed(2)
const csvLine = (fields: string[]) => fields.map(escapeCsvField).join(",")

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
  "Credit notes",
] as const

export function invoiceRegisterCsv(invoices: RecordInvoice[], sellerStateCode: string): string {
  const sorted = sortInvoices(invoices)
  const rows = sorted.map((inv) =>
    csvLine([
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
      (inv.creditNotes ?? []).join("; "),
    ])
  )
  const s = summarise(sorted, sellerStateCode)
  const total = csvLine(["Total", "", "", `${s.invoices} invoices`, "", "", "", "", money(s.taxableValue), money(s.cgst), money(s.sgst), money(s.igst), money(s.total), "", ""])
  return [REGISTER_COLUMNS.join(","), ...rows, total].join("\n") + "\n"
}

export const CREDIT_REGISTER_COLUMNS = [
  "Credit note number",
  "Credit note date",
  "Against invoice",
  "Invoice date",
  "Order",
  "Customer",
  "Buyer GSTIN",
  "Place of supply",
  "GSTR-1",
  "Taxable value",
  "CGST",
  "SGST",
  "IGST",
  "Credit note value",
  "Reason",
] as const

export function creditNoteRegisterCsv(creditNotes: RecordCreditNote[]): string {
  const sorted = sortCreditNotes(creditNotes)
  const rows = sorted.map((cn) =>
    csvLine([
      cn.number,
      istDate(cn.date),
      cn.invoiceNumber,
      istDate(cn.invoiceDate),
      cn.orderCode,
      cn.customerName ?? "",
      cn.buyerGstin ?? "",
      placeOfSupplyLabel(cn.placeOfSupply),
      CN_TABLE_LABEL[creditNoteTable(cn)],
      money(cn.taxableValue),
      money(cn.cgst),
      money(cn.sgst),
      money(cn.igst),
      money(cn.amount),
      cn.reason,
    ])
  )
  const t = emptyTotals()
  for (const cn of sorted) addTotals(t, cn)
  const total = csvLine(["Total", "", "", "", "", `${sorted.length} credit notes`, "", "", "", money(t.taxableValue), money(t.cgst), money(t.sgst), money(t.igst), money(t.total), ""])
  return [CREDIT_REGISTER_COLUMNS.join(","), ...rows, total].join("\n") + "\n"
}
