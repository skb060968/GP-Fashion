import { escapeCsvField } from "@/lib/admin/csvExport"
import { istDate } from "@/lib/gst/gstr1"
import { PURCHASE_CATEGORY_LABEL, PURCHASE_KIND_LABEL, purchaseCost, purchaseTotal, type PurchaseCategory, type PurchaseKind } from "./purchases"

export type RegisterRow = {
  kind: string
  category: string
  date: Date | string
  supplierName: string
  supplierGstin: string | null
  billNumber: string | null
  description: string
  taxableValue: number
  igst: number
  cgst: number
  sgst: number
  claimItc: boolean
  order: { orderCode: string } | null
  challan: { number: string } | null
}

const money = (p: number) => (p / 100).toFixed(2)
const csvLine = (fields: string[]) => fields.map(escapeCsvField).join(",")

export const PURCHASE_REGISTER_COLUMNS = [
  "Date",
  "Type",
  "For",
  "Supplier",
  "Supplier GSTIN",
  "Bill number",
  "Description",
  "Order",
  "Job work challan",
  "Taxable value",
  "IGST",
  "CGST",
  "SGST",
  "Total",
  "Input tax credit claimed",
  "Cost after credit",
] as const

export function purchaseRegisterCsv(rows: RegisterRow[]): string {
  const sign = (r: RegisterRow) => (r.kind === "CREDIT_NOTE" ? -1 : 1)
  const lines = rows.map((r) =>
    csvLine([
      istDate(r.date),
      PURCHASE_KIND_LABEL[r.kind as PurchaseKind] ?? r.kind,
      PURCHASE_CATEGORY_LABEL[r.category as PurchaseCategory] ?? r.category,
      r.supplierName,
      r.supplierGstin ?? "",
      r.billNumber ?? "",
      r.description,
      r.order?.orderCode ?? "",
      r.challan?.number ?? "",
      money(sign(r) * r.taxableValue),
      money(sign(r) * r.igst),
      money(sign(r) * r.cgst),
      money(sign(r) * r.sgst),
      money(purchaseTotal(r)),
      r.claimItc ? "Yes" : "No",
      money(purchaseCost(r)),
    ])
  )
  const sum = (f: (r: RegisterRow) => number) => money(rows.reduce((n, r) => n + f(r), 0))
  const claimed = rows.filter((r) => r.claimItc)
  const total = csvLine([
    "Total", "", "", "", "", "", `${rows.length} ${rows.length === 1 ? "entry" : "entries"}`, "", "",
    sum((r) => sign(r) * r.taxableValue), sum((r) => sign(r) * r.igst), sum((r) => sign(r) * r.cgst), sum((r) => sign(r) * r.sgst),
    sum(purchaseTotal), `credit ${money(claimed.reduce((n, r) => n + sign(r) * (r.igst + r.cgst + r.sgst), 0))}`, sum(purchaseCost),
  ])
  return [PURCHASE_REGISTER_COLUMNS.join(","), ...lines, total].join("\n") + "\n"
}
