import { escapeCsvField } from "@/lib/admin/csvExport"
import { istDate } from "@/lib/gst/gstr1"
import { excelDate, excelPlace } from "@/lib/gst/gstr1Excel"
import { stateByCode } from "@/lib/gst/states"
import type { Cell, Sheet } from "@/lib/xlsx"
import { LINE_KIND_LABEL, challanLinesText, challanPiecesText, challanStatus, dueSoon, returnDeadline, type ChallanPiece, type LineKind } from "./challan"

export type RecordChallanLine = { kind: string; description: string; hsn: string; quantity: number; unit: string; taxableValue: number; gstRate: number; taxAmount: number }

export type RecordChallan = {
  number: string
  date: Date | string
  orderCode: string
  tailorName: string
  tailorStateCode: string
  tailorGstin: string | null
  sellerStateCode: string
  pieces: ChallanPiece[]
  lines: RecordChallanLine[]
  taxableValue: number
  taxAmount: number
  ewayBill: string | null
  receivedAt: Date | string | null
  receivedNote: string | null
  receivedEwayBill: string | null
  cancelledAt: Date | string | null
  cancelReason: string | null
}

const money = (p: number) => (p / 100).toFixed(2)
const csvLine = (fields: string[]) => fields.map(escapeCsvField).join(",")
const sequence = (number: string) => Number(number.split("/").pop()) || 0

export function sortChallans<T extends { number: string; date: Date | string }>(list: T[]): T[] {
  return [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || sequence(a.number) - sequence(b.number))
}

const kindLabel = (k: string) => LINE_KIND_LABEL[k as LineKind] ?? k
const stateName = (code: string) => stateByCode(code)?.name ?? code

export const CHALLAN_REGISTER_COLUMNS = [
  "Challan number",
  "Challan date",
  "Order",
  "Tailor",
  "Tailor state",
  "Tailor GSTIN",
  "Pieces to make",
  "Goods sent",
  "Value of goods",
  "GST shown (not charged)",
  "E-way bill (sent)",
  "Status",
  "Return due by",
  "Received back on",
  "Goods received back",
  "E-way bill (return)",
  "Cancel reason",
] as const

export function challanRegisterCsv(challans: RecordChallan[]): string {
  const sorted = sortChallans(challans)
  const statusText = { open: "Open (with the tailor)", received: "Received back", cancelled: "Cancelled" }
  const rows = sorted.map((c) => {
    const status = challanStatus(c)
    return csvLine([
      c.number,
      istDate(c.date),
      c.orderCode,
      c.tailorName,
      stateName(c.tailorStateCode),
      c.tailorGstin ?? "Unregistered",
      challanPiecesText(c.pieces),
      challanLinesText(c.lines),
      money(c.taxableValue),
      money(c.taxAmount),
      c.ewayBill ?? "",
      statusText[status],
      status === "cancelled" ? "" : istDate(returnDeadline(c.date)),
      c.receivedAt ? istDate(c.receivedAt) : "",
      c.receivedNote ?? "",
      c.receivedEwayBill ?? "",
      c.cancelReason ?? "",
    ])
  })
  const live = sorted.filter((c) => challanStatus(c) !== "cancelled")
  const total = csvLine([
    "Total",
    "",
    "",
    "",
    "",
    "",
    "",
    `${live.length} ${live.length === 1 ? "challan" : "challans"}`,
    money(live.reduce((n, c) => n + c.taxableValue, 0)),
    money(live.reduce((n, c) => n + c.taxAmount, 0)),
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ])
  return [CHALLAN_REGISTER_COLUMNS.join(","), ...rows, total].join("\n") + "\n"
}

const UQC: Record<string, string> = { MTR: "MTR-METERS", PCS: "PCS-PIECES", NOS: "NOS-NUMBERS", SET: "SET-SETS", ROL: "ROL-ROLLS" }

export const ITC04_HEAD = {
  sent: [
    "GSTIN of Job Worker (If any)",
    "State (in case of unregistered job worker)",
    "Job Worker's Type",
    "Challan Number",
    "Challan Date",
    "Types of Goods",
    "Description of Goods",
    "Unique Quantity Code (UQC)",
    "Quantity",
    "Taxable Value",
    "Integrated Tax Rate in (%)",
    "Central Tax Rate in (%)",
    "State/UT Tax Rate in (%)",
    "Cess",
  ],
  received: [
    "GSTIN of Job Worker (If any)",
    "State (in case of unregistered job worker)",
    "Original Challan Number (Challan issued by manufacturer)",
    "Original Challan Date (Challan issued by manufacturer)",
    "Challan Number (Challan issued by job worker)",
    "Challan Date (Challan issued by job worker)",
    "Nature of Job Work done",
    "Description of Goods",
    "Unique Quantity Code (UQC)",
    "Quantity",
    "Losses UQC",
    "Losses Quantity",
  ],
}

const width = (head: string[]) => head.map((h) => Math.max(12, Math.min(30, h.length + 2)))
const party = (c: RecordChallan): [Cell, Cell] => (c.tailorGstin ? [c.tailorGstin, null] : [null, excelPlace(c.tailorStateCode)])

export function itc04Sheets(sent: RecordChallan[], received: RecordChallan[]): Sheet[] {
  const sentRows: Cell[][] = []
  for (const c of sortChallans(sent)) {
    if (challanStatus(c) === "cancelled") continue
    const intra = c.tailorStateCode === c.sellerStateCode
    for (const l of c.lines) {
      sentRows.push([
        ...party(c),
        "Non SEZ",
        c.number,
        excelDate(istDate(c.date)),
        "Inputs",
        `${kindLabel(l.kind)}: ${l.description}`,
        UQC[l.unit] ?? l.unit,
        Math.round(l.quantity * 1000) / 1000,
        l.taxableValue / 100,
        intra ? null : l.gstRate,
        intra ? l.gstRate / 2 : null,
        intra ? l.gstRate / 2 : null,
        0,
      ])
    }
  }
  const receivedRows: Cell[][] = sortChallans(received)
    .filter((c) => challanStatus(c) === "received")
    .map((c) => [
      ...party(c),
      c.number,
      excelDate(istDate(c.date)),
      null,
      null,
      "Stitching",
      c.receivedNote ?? challanPiecesText(c.pieces),
      "PCS-PIECES",
      c.pieces.reduce((n, p) => n + p.quantity, 0),
      null,
      null,
    ])
  return [
    { name: "4", rows: [ITC04_HEAD.sent, ...sentRows], widths: width(ITC04_HEAD.sent) },
    { name: "5A", rows: [ITC04_HEAD.received, ...receivedRows], widths: width(ITC04_HEAD.received) },
  ]
}

export function challanWarnings(open: { number: string; date: Date | string; receivedAt: Date | string | null; cancelledAt: Date | string | null }[], now = new Date()): string[] {
  return sortChallans(open)
    .filter((c) => dueSoon(c, now))
    .map((c) => {
      const due = returnDeadline(c.date)
      return now >= due
        ? `Challan ${c.number} has been with the tailor for more than a year. GST treats the fabric as supplied to the tailor: speak to your CA about paying tax on it.`
        : `Challan ${c.number} is due back from the tailor by ${istDate(due)}. Goods sent for job work must come back within one year.`
    })
}
