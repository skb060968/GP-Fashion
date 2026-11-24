import { stateByCode } from "./states"
import type { Cell, Sheet } from "@/lib/xlsx"

type ItmDet = { rt: number; txval: number; iamt?: number; camt?: number; samt?: number; csamt?: number }
type Itm = { num: number; itm_det: ItmDet }
type Gstr1Json = {
  b2b?: { ctin: string; inv: { inum: string; idt: string; val: number; pos: string; rchrg: string; inv_typ: string; itms: Itm[] }[] }[]
  b2cl?: { pos: string; inv: { inum: string; idt: string; val: number; itms: Itm[] }[] }[]
  b2cs?: { sply_ty: string; pos: string; typ: string; rt: number; txval: number; csamt?: number }[]
  cdnr?: { ctin: string; nt: { ntty: string; nt_num: string; nt_dt: string; val: number; pos: string; rchrg: string; inv_typ: string; itms: Itm[] }[] }[]
  cdnur?: { typ: string; ntty: string; nt_num: string; nt_dt: string; val: number; pos: string; itms: Itm[] }[]
  hsn?: { hsn_b2b?: HsnRow[]; hsn_b2c?: HsnRow[] }
  doc_issue?: { doc_det: { doc_num: number; docs: { from: string; to: string; totnum: number; cancel: number }[] }[] }
}
type HsnRow = { hsn_sc: string; desc: string; uqc: string; qty: number; rt: number; txval: number; iamt: number; camt: number; samt: number; csamt: number }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const INV_TYPE: Record<string, string> = { R: "Regular B2B", DE: "Deemed Exp", SEWP: "SEZ supplies with payment", SEWOP: "SEZ supplies without payment" }
const DOC_NATURE: Record<number, string> = { 1: "Invoices for outward supply", 5: "Credit Note" }
const UQC: Record<string, string> = { PCS: "PCS-PIECES", NOS: "NOS-NUMBERS" }

export const excelDate = (ddmmyyyy: string) => {
  const [d, m, y] = ddmmyyyy.split("-")
  return `${d}-${MONTHS[Number(m) - 1] ?? m}-${y}`
}

export const excelPlace = (code: string) => {
  const s = stateByCode(code)
  return s ? `${s.code}-${s.name}` : code
}

const r2 = (n: number) => Math.round(n * 100) / 100

const HEAD = {
  b2b: ["GSTIN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Reverse Charge", "Applicable % of Tax Rate", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "Cess Amount"],
  b2cl: ["Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"],
  b2cs: ["Type", "Place Of Supply", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount", "E-Commerce GSTIN"],
  cdnr: ["GSTIN/UIN of Recipient", "Receiver Name", "Note Number", "Note Date", "Note Type", "Place Of Supply", "Reverse Charge", "Note Supply Type", "Note Value", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount"],
  cdnur: ["UR Type", "Note Number", "Note Date", "Note Type", "Place Of Supply", "Note Value", "Applicable % of Tax Rate", "Rate", "Taxable Value", "Cess Amount"],
  hsn: ["HSN", "Description", "UQC", "Total Quantity", "Total Value", "Rate", "Taxable Value", "Integrated Tax Amount", "Central Tax Amount", "State/UT Tax Amount", "Cess Amount"],
  docs: ["Nature of Document", "Sr. No. From", "Sr. No. To", "Total Number", "Cancelled"],
}

const width = (head: string[]) => head.map((h) => Math.max(12, Math.min(28, h.length + 2)))

export function gstr1Sheets(json: Record<string, unknown>, buyerNames: Record<string, string> = {}): Sheet[] {
  const g = json as Gstr1Json
  const sheet = (name: string, head: string[], rows: Cell[][]): Sheet => ({ name, rows: [head, ...rows], widths: width(head) })

  const b2b: Cell[][] = []
  for (const party of g.b2b ?? []) {
    for (const inv of party.inv) {
      for (const it of inv.itms) {
        b2b.push([party.ctin, buyerNames[party.ctin] ?? "", inv.inum, excelDate(inv.idt), inv.val, excelPlace(inv.pos), inv.rchrg, null, INV_TYPE[inv.inv_typ] ?? inv.inv_typ, null, it.itm_det.rt, it.itm_det.txval, it.itm_det.csamt ?? 0])
      }
    }
  }

  const b2cl: Cell[][] = []
  for (const group of g.b2cl ?? []) {
    for (const inv of group.inv) {
      for (const it of inv.itms) b2cl.push([inv.inum, excelDate(inv.idt), inv.val, excelPlace(group.pos), null, it.itm_det.rt, it.itm_det.txval, it.itm_det.csamt ?? 0, null])
    }
  }

  const b2cs: Cell[][] = (g.b2cs ?? []).map((r) => [r.typ, excelPlace(r.pos), null, r.rt, r.txval, r.csamt ?? 0, null])

  const cdnr: Cell[][] = []
  for (const party of g.cdnr ?? []) {
    for (const nt of party.nt) {
      for (const it of nt.itms) {
        cdnr.push([party.ctin, buyerNames[party.ctin] ?? "", nt.nt_num, excelDate(nt.nt_dt), nt.ntty, excelPlace(nt.pos), nt.rchrg, INV_TYPE[nt.inv_typ] ?? nt.inv_typ, nt.val, null, it.itm_det.rt, it.itm_det.txval, it.itm_det.csamt ?? 0])
      }
    }
  }

  const cdnur: Cell[][] = []
  for (const nt of g.cdnur ?? []) {
    for (const it of nt.itms) cdnur.push([nt.typ, nt.nt_num, excelDate(nt.nt_dt), nt.ntty, excelPlace(nt.pos), nt.val, null, it.itm_det.rt, it.itm_det.txval, it.itm_det.csamt ?? 0])
  }

  const hsn = (list: HsnRow[] | undefined): Cell[][] =>
    (list ?? []).map((h) => [h.hsn_sc, h.desc, UQC[h.uqc] ?? h.uqc, h.qty, r2(h.txval + h.iamt + h.camt + h.samt + h.csamt), h.rt, h.txval, h.iamt, h.camt, h.samt, h.csamt])

  const docs: Cell[][] = []
  for (const d of g.doc_issue?.doc_det ?? []) {
    for (const doc of d.docs) docs.push([DOC_NATURE[d.doc_num] ?? String(d.doc_num), doc.from, doc.to, doc.totnum, doc.cancel])
  }

  return [
    sheet("b2b", HEAD.b2b, b2b),
    sheet("b2cl", HEAD.b2cl, b2cl),
    sheet("b2cs", HEAD.b2cs, b2cs),
    sheet("cdnr", HEAD.cdnr, cdnr),
    sheet("cdnur", HEAD.cdnur, cdnur),
    sheet("hsn(b2b)", HEAD.hsn, hsn(g.hsn?.hsn_b2b)),
    sheet("hsn(b2c)", HEAD.hsn, hsn(g.hsn?.hsn_b2c)),
    sheet("docs", HEAD.docs, docs),
  ]
}
