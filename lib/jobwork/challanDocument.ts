import { GSTIN_PLACEHOLDER } from "@/lib/data/business"
import { placeOfSupplyLabel } from "@/lib/gst/states"
import { LINE_KIND_LABEL, UNIT_LABEL, challanFileName, challanStatus, parsePieces, returnDeadline, taxSplit, type LineKind, type Unit } from "./challan"

export type DocumentChallan = {
  number: string
  date: Date
  pieces: unknown
  taxableValue: number
  taxAmount: number
  fabricBill: string | null
  ewayBill: string | null
  note: string | null
  tailorName: string
  tailorAddress: string
  tailorStateCode: string
  tailorGstin: string | null
  tailorPhone: string | null
  sellerGstin: string
  sellerLegalName: string
  sellerTradeName: string
  sellerAddress: string
  sellerStateCode: string
  sellerEmail: string
  sellerPhone: string
  receivedAt: Date | null
  receivedNote: string | null
  receivedEwayBill: string | null
  cancelledAt: Date | null
  cancelReason: string | null
  order: { orderCode: string }
  lines: { id: string; position: number; kind: string; description: string; hsn: string; quantity: number; unit: string; taxableValue: number; gstRate: number; taxAmount: number }[]
}

export const CHALLAN_COPIES = ["Original for the job worker", "Duplicate for the transporter", "Triplicate for the sender"] as const

const qty = (n: number) => String(Math.round(n * 1000) / 1000)

export function challanDocument(c: DocumentChallan) {
  const intraState = c.tailorStateCode === c.sellerStateCode
  const lines = [...c.lines].sort((a, b) => a.position - b.position)
  return {
    title: "Delivery challan",
    number: c.number,
    date: c.date,
    fileName: challanFileName(c.number),
    orderCode: c.order.orderCode,
    status: challanStatus(c),
    specimen: c.sellerGstin === GSTIN_PLACEHOLDER,
    returnBy: returnDeadline(c.date),
    seller: {
      name: c.sellerLegalName,
      tradeName: c.sellerTradeName,
      addressLines: c.sellerAddress.split("\n"),
      gstin: c.sellerGstin,
      state: placeOfSupplyLabel(c.sellerStateCode),
      email: c.sellerEmail,
      phone: c.sellerPhone,
    },
    tailor: {
      name: c.tailorName,
      addressLines: c.tailorAddress.split("\n"),
      state: placeOfSupplyLabel(c.tailorStateCode),
      gstin: c.tailorGstin,
      phone: c.tailorPhone,
    },
    placeOfSupply: placeOfSupplyLabel(c.tailorStateCode),
    interState: !intraState,
    fabricBill: c.fabricBill,
    ewayBill: c.ewayBill,
    note: c.note,
    pieces: parsePieces(c.pieces),
    lines: lines.map((l, i) => ({
      id: l.id,
      no: i + 1,
      name: `${LINE_KIND_LABEL[l.kind as LineKind] ?? l.kind}: ${l.description}`,
      hsn: l.hsn,
      quantity: `${qty(l.quantity)} ${UNIT_LABEL[l.unit as Unit] ?? l.unit}`,
      taxable: l.taxableValue,
      rate: `${l.gstRate}%`,
      tax: l.taxAmount,
    })),
    totals: {
      taxableValue: c.taxableValue,
      taxParts: taxSplit(c.taxAmount, intraState).map((t) => ({ label: `${t.label} (not charged)`, value: t.value })),
      total: c.taxableValue + c.taxAmount,
    },
    received: c.receivedAt ? { date: c.receivedAt, note: c.receivedNote ?? "", ewayBill: c.receivedEwayBill } : null,
    cancelled: c.cancelledAt ? { date: c.cancelledAt, reason: c.cancelReason ?? "" } : null,
  }
}
