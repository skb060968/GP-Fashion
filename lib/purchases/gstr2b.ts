import { normaliseGstin } from "@/lib/gst/gstin"
import { zeroHeads, type Heads } from "@/lib/gst/taxHeads"
import { PurchaseError, billKey, isGstKind } from "./purchases"

export type Gstr2bDoc = {
  section: "B2B" | "CDNR"
  noteType: "C" | "D" | null
  ctin: string
  supplier: string
  number: string
  key: string
  date: string
  value: number
  taxableValue: number
  igst: number
  cgst: number
  sgst: number
  itcAvailable: boolean
  reason: string | null
}

export type Gstr2bFile = { gstin: string; period: string; generatedOn: string | null; docs: Gstr2bDoc[]; other: { section: string; count: number }[] }

type Obj = Record<string, unknown>
const obj = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "")
const paise = (v: unknown) => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

function isoDate(ddmmyyyy: string): string {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(ddmmyyyy.trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : ""
}

function amounts(doc: Obj) {
  const items = arr(doc.items ?? doc.itms).map(obj).filter((x): x is Obj => !!x).map((i) => obj(i.itm_det) ?? i)
  const pick = (o: Obj, a: string, b: string) => paise(o[a] ?? o[b])
  const fromItems = (a: string, b: string) => items.reduce((n, i) => n + pick(i, a, b), 0)
  const has = (a: string, b: string) => doc[a] !== undefined || doc[b] !== undefined
  return {
    taxableValue: has("txval", "txval") ? paise(doc.txval) : fromItems("txval", "txval"),
    igst: has("igst", "iamt") ? pick(doc, "igst", "iamt") : fromItems("igst", "iamt"),
    cgst: has("cgst", "camt") ? pick(doc, "cgst", "camt") : fromItems("cgst", "camt"),
    sgst: has("sgst", "samt") ? pick(doc, "sgst", "samt") : fromItems("sgst", "samt"),
  }
}

const OTHER_SECTIONS = ["b2ba", "cdnra", "isd", "isda", "impg", "impgsez", "ecom", "ecoma"]

export function parseGstr2b(text: string, expectedGstin: string): Gstr2bFile {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new PurchaseError("This is not a GSTR-2B JSON file. Download it from the GSTR-2B tile on the Returns Dashboard as JSON.")
  }
  const root = obj(json)
  const data = obj(root?.data) ?? root
  const docdata = obj(data?.docdata)
  const gstin = normaliseGstin(str(data?.gstin))
  const rtnprd = str(data?.rtnprd)
  if (!data || !docdata || !/^\d{6}$/.test(rtnprd)) {
    throw new PurchaseError("This file does not look like GSTR-2B. Download it from the GSTR-2B tile on the Returns Dashboard as JSON.")
  }
  if (gstin && gstin !== expectedGstin) throw new PurchaseError(`This GSTR-2B is for GSTIN ${gstin}, not ${expectedGstin}`)
  const period = `${rtnprd.slice(2)}-${rtnprd.slice(0, 2)}`

  const docs: Gstr2bDoc[] = []
  for (const s of arr(docdata.b2b).map(obj)) {
    if (!s) continue
    const ctin = normaliseGstin(str(s.ctin))
    for (const inv of arr(s.inv).map(obj)) {
      if (!inv) continue
      const number = str(inv.inum)
      docs.push({
        section: "B2B", noteType: null, ctin, supplier: str(s.trdnm), number, key: billKey(number), date: isoDate(str(inv.dt)), value: paise(inv.val),
        ...amounts(inv), itcAvailable: str(inv.itcavl || "Y").toUpperCase() !== "N", reason: str(inv.rsn) || null,
      })
    }
  }
  for (const s of arr(docdata.cdnr).map(obj)) {
    if (!s) continue
    const ctin = normaliseGstin(str(s.ctin))
    for (const nt of arr(s.nt).map(obj)) {
      if (!nt) continue
      const number = str(nt.ntnum ?? nt.nt_num)
      const t = str(nt.typ ?? nt.ntty).toUpperCase()
      docs.push({
        section: "CDNR", noteType: t === "D" ? "D" : "C", ctin, supplier: str(s.trdnm), number, key: billKey(number), date: isoDate(str(nt.dt ?? nt.nt_dt)), value: paise(nt.val),
        ...amounts(nt), itcAvailable: str(nt.itcavl || "Y").toUpperCase() !== "N", reason: str(nt.rsn) || null,
      })
    }
  }
  const other = OTHER_SECTIONS.map((section) => ({
    section,
    count: arr(docdata[section]).reduce<number>((n, s) => n + (obj(s) ? Math.max(1, arr(obj(s)!.inv ?? obj(s)!.nt ?? obj(s)!.doclist).length) : 0), 0),
  })).filter((o) => o.count > 0)

  return { gstin: gstin || expectedGstin, period, generatedOn: str(data.gendt) || null, docs, other }
}

export type MatchStatus = "matched" | "differs" | "unavailable" | "awaiting" | "noCredit"

export type RegisterEntry = {
  id: string
  kind: string
  supplierGstin: string | null
  billKey: string | null
  taxableValue: number
  igst: number
  cgst: number
  sgst: number
  claimItc: boolean
}

export type ImportDocs = { period: string; docs: Gstr2bDoc[] }

export type MatchResult = {
  entries: Map<string, { status: MatchStatus; period: string | null; doc: Gstr2bDoc | null }>
  unmatched: (Gstr2bDoc & { period: string })[]
  itcByPeriod: Map<string, Heads>
}

const TOLERANCE = 100

const docKind = (d: Gstr2bDoc) => (d.section === "CDNR" && d.noteType === "C" ? "CREDIT_NOTE" : "BILL")
const close = (a: number, b: number) => Math.abs(a - b) <= TOLERANCE

export function matchGstr2b(register: RegisterEntry[], imports: ImportDocs[]): MatchResult {
  const sorted = [...imports].sort((a, b) => a.period.localeCompare(b.period))
  const seen = new Set<string>()
  const byKey = new Map<string, RegisterEntry[]>()
  for (const e of register) {
    if (!isGstKind(e.kind) || !e.supplierGstin || !e.billKey) continue
    const k = `${e.kind}|${e.supplierGstin}|${e.billKey}`
    byKey.set(k, [...(byKey.get(k) ?? []), e])
  }
  const entries: MatchResult["entries"] = new Map()
  const unmatched: MatchResult["unmatched"] = []
  const itcByPeriod = new Map<string, Heads>()

  for (const imp of sorted) {
    for (const d of imp.docs) {
      const id = `${d.section}|${d.noteType}|${d.ctin}|${d.key}`
      if (seen.has(id)) continue
      seen.add(id)
      const candidates = (byKey.get(`${docKind(d)}|${d.ctin}|${d.key}`) ?? []).filter((e) => !entries.has(e.id))
      const e = candidates[0]
      if (!e) {
        unmatched.push({ ...d, period: imp.period })
        continue
      }
      let status: MatchStatus
      if (!e.claimItc) status = "noCredit"
      else if (!d.itcAvailable) status = "unavailable"
      else if (close(e.taxableValue, d.taxableValue) && close(e.igst, d.igst) && close(e.cgst, d.cgst) && close(e.sgst, d.sgst)) status = "matched"
      else status = "differs"
      entries.set(e.id, { status, period: imp.period, doc: d })
      if (status === "matched") {
        const s = docKind(d) === "CREDIT_NOTE" ? -1 : 1
        const t = itcByPeriod.get(imp.period) ?? zeroHeads()
        itcByPeriod.set(imp.period, { igst: t.igst + s * d.igst, cgst: t.cgst + s * d.cgst, sgst: t.sgst + s * d.sgst })
      }
    }
  }
  for (const e of register) {
    if (entries.has(e.id)) continue
    entries.set(e.id, { status: isGstKind(e.kind) && e.claimItc ? "awaiting" : "noCredit", period: null, doc: null })
  }
  return { entries, unmatched, itcByPeriod }
}
