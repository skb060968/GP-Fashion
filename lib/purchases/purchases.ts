import { gstinError, normaliseGstin } from "@/lib/gst/gstin"
import { IST_OFFSET_MS } from "@/lib/gst/period"
import { zeroHeads, type Heads } from "@/lib/gst/taxHeads"

export class PurchaseError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export const PURCHASE_KINDS = ["BILL", "CREDIT_NOTE", "NO_GST"] as const
export type PurchaseKind = (typeof PURCHASE_KINDS)[number]
export const PURCHASE_KIND_LABEL: Record<PurchaseKind, string> = {
  BILL: "GST bill",
  CREDIT_NOTE: "Supplier credit note",
  NO_GST: "Expense without GST",
}

export const PURCHASE_CATEGORIES = ["FABRIC", "LINING", "TRIM", "STITCHING", "PACKAGING", "COURIER", "OTHER"] as const
export type PurchaseCategory = (typeof PURCHASE_CATEGORIES)[number]
export const PURCHASE_CATEGORY_LABEL: Record<PurchaseCategory, string> = {
  FABRIC: "Fabric",
  LINING: "Lining",
  TRIM: "Trims and buttons",
  STITCHING: "Stitching (tailor)",
  PACKAGING: "Packaging",
  COURIER: "Courier",
  OTHER: "Other",
}

export const isGstKind = (k: string) => k === "BILL" || k === "CREDIT_NOTE"

export function billKey(number: string): string {
  return number.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^0+(?=.)/, "")
}

export const istDayOf = (d: Date | string) => new Date(new Date(d).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)

function dayFromInput(input: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) - IST_OFFSET_MS)
  return istDayOf(d) === input ? d : null
}

export type PurchaseInput = {
  kind: string
  category: string
  date: string
  supplierName: string
  supplierGstin?: string
  billNumber?: string
  description: string
  taxableValue: number
  igst?: number
  cgst?: number
  sgst?: number
  claimItc?: boolean
  note?: string
}

export type PurchaseRecord = {
  kind: PurchaseKind
  category: PurchaseCategory
  date: Date
  supplierName: string
  supplierGstin: string | null
  supplierStateCode: string | null
  billNumber: string | null
  billKey: string | null
  description: string
  taxableValue: number
  igst: number
  cgst: number
  sgst: number
  claimItc: boolean
  note: string | null
}

const money = (v: number | undefined, label: string) => {
  const n = v ?? 0
  if (!Number.isInteger(n) || n < 0 || n > 10_000_000_000) throw new PurchaseError(`Enter the ${label}`)
  return n
}

export function checkPurchase(input: PurchaseInput, sellerStateCode: string, registeredOn: Date, now = new Date()): PurchaseRecord {
  if (!(PURCHASE_KINDS as readonly string[]).includes(input.kind)) throw new PurchaseError("Choose the type of entry")
  if (!(PURCHASE_CATEGORIES as readonly string[]).includes(input.category)) throw new PurchaseError("Choose what it was for")
  const kind = input.kind as PurchaseKind
  const date = dayFromInput(input.date)
  if (!date) throw new PurchaseError("Enter the date on the bill")
  if (istDayOf(date) > istDayOf(now)) throw new PurchaseError("The bill date cannot be in the future")
  const supplierName = input.supplierName.trim()
  if (supplierName.length < 2) throw new PurchaseError("Enter the supplier's name")
  if (supplierName.length > 100) throw new PurchaseError("The supplier's name is too long")
  const description = input.description.trim()
  if (!description) throw new PurchaseError("Describe what was bought, for example \"Silk crepe, 3 m\"")
  if (description.length > 200) throw new PurchaseError("Keep the description under 200 characters")
  const note = input.note?.trim() || null
  if (note && note.length > 300) throw new PurchaseError("Keep the note under 300 characters")
  const taxableValue = money(input.taxableValue, "amount before GST")
  if (taxableValue === 0) throw new PurchaseError(kind === "NO_GST" ? "Enter the amount paid" : "Enter the amount before GST")

  const rawGstin = input.supplierGstin ? normaliseGstin(input.supplierGstin) : ""
  if (rawGstin) {
    const err = gstinError(rawGstin)
    if (err) throw new PurchaseError(`Supplier GSTIN: ${err}`)
  }
  const billNumber = input.billNumber?.trim() || null
  if (billNumber && billNumber.length > 16) throw new PurchaseError("A GST bill number has at most 16 characters")

  if (kind === "NO_GST") {
    return {
      kind, category: input.category as PurchaseCategory, date, supplierName,
      supplierGstin: rawGstin || null, supplierStateCode: rawGstin ? rawGstin.slice(0, 2) : null,
      billNumber, billKey: billNumber ? billKey(billNumber) : null,
      description, taxableValue, igst: 0, cgst: 0, sgst: 0, claimItc: false, note,
    }
  }

  if (!rawGstin) throw new PurchaseError("Enter the supplier's GSTIN from the bill")
  if (!billNumber) throw new PurchaseError(kind === "CREDIT_NOTE" ? "Enter the credit note number" : "Enter the bill number")
  const igst = money(input.igst, "IGST")
  const cgst = money(input.cgst, "CGST")
  const sgst = money(input.sgst, "SGST")
  const stateCode = rawGstin.slice(0, 2)
  if (stateCode === sellerStateCode) {
    if (igst > 0) throw new PurchaseError("A supplier in the same state charges CGST and SGST, not IGST")
    if (Math.abs(cgst - sgst) > 100) throw new PurchaseError("CGST and SGST on a bill are equal")
  } else if (cgst > 0 || sgst > 0) {
    throw new PurchaseError("A supplier in another state charges IGST, not CGST and SGST")
  }
  const claimItc = input.claimItc ?? true
  if (claimItc && date < registeredOn) throw new PurchaseError("Input tax credit for bills dated before the GST registration is not claimed here. Untick it, and ask your CA.")
  return {
    kind, category: input.category as PurchaseCategory, date, supplierName,
    supplierGstin: rawGstin, supplierStateCode: stateCode, billNumber, billKey: billKey(billNumber),
    description, taxableValue, igst, cgst, sgst, claimItc, note,
  }
}

export type PurchaseAmounts = { kind: string; taxableValue: number; igst: number; cgst: number; sgst: number; claimItc: boolean }

const sign = (p: { kind: string }) => (p.kind === "CREDIT_NOTE" ? -1 : 1)

export const purchaseTax = (p: PurchaseAmounts): Heads => ({ igst: sign(p) * p.igst, cgst: sign(p) * p.cgst, sgst: sign(p) * p.sgst })

export const purchaseTotal = (p: PurchaseAmounts) => sign(p) * (p.taxableValue + p.igst + p.cgst + p.sgst)

export const purchaseCost = (p: PurchaseAmounts) => sign(p) * (p.claimItc ? p.taxableValue : p.taxableValue + p.igst + p.cgst + p.sgst)

export function periodMonths(from: Date, to: Date): string[] {
  const out: string[] = []
  const start = new Date(from.getTime() + IST_OFFSET_MS)
  for (let i = 0; ; i++) {
    const first = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1) - IST_OFFSET_MS)
    if (first >= to) break
    const ist = new Date(first.getTime() + IST_OFFSET_MS)
    out.push(`${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}`)
  }
  return out
}

export function sumItc(list: PurchaseAmounts[]): Heads {
  return list.filter((p) => p.claimItc && isGstKind(p.kind)).reduce((t, p) => {
    const x = purchaseTax(p)
    return { igst: t.igst + x.igst, cgst: t.cgst + x.cgst, sgst: t.sgst + x.sgst }
  }, zeroHeads())
}
