"use client"

import { useMemo, useState } from "react"
import { Alert, Dialog, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { business } from "@/lib/data/business"
import { formatRupeesExact } from "@/lib/money"
import { normaliseGstin } from "@/lib/gst/gstin"
import { placeOfSupplyLabel } from "@/lib/gst/states"
import { IST_OFFSET_MS } from "@/lib/gst/period"
import {
  PURCHASE_CATEGORIES,
  PURCHASE_CATEGORY_LABEL,
  PURCHASE_KINDS,
  PURCHASE_KIND_LABEL,
  type PurchaseCategory,
  type PurchaseKind,
} from "@/lib/purchases/purchases"

export type AdminPurchase = {
  id: string
  kind: string
  category: string
  date: string
  supplierName: string
  supplierGstin: string | null
  supplierStateCode: string | null
  billNumber: string | null
  description: string
  taxableValue: number
  igst: number
  cgst: number
  sgst: number
  claimItc: boolean
  note: string | null
  orderCode?: string | null
  challanNumber?: string | null
  order?: { orderCode: string } | null
  challan?: { number: string } | null
}

export type PurchasePrefill = Partial<Pick<AdminPurchase, "kind" | "category" | "supplierName" | "supplierGstin" | "billNumber" | "description" | "taxableValue" | "igst" | "cgst" | "sgst">> & { date?: string }

const RATES = [0, 5, 12, 18, 28, 40]
const label = "block font-jost text-xs font-semibold uppercase tracking-[0.12em] text-black/60"
const today = () => new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10)
const istDay = (iso: string) => new Date(new Date(iso).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
const rupees = (p: number | undefined) => (p ? String(p / 100) : "")
const paise = (t: string) => {
  const n = Number(t.replace(/,/g, "").trim())
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}

export default function PurchaseDialog({
  initial,
  prefill,
  order,
  onClose,
  onSaved,
}: {
  initial?: AdminPurchase | null
  prefill?: PurchasePrefill
  order?: { orderCode: string; challans: { number: string; label: string }[] }
  onClose: () => void
  onSaved: (p: AdminPurchase) => void
}) {
  const start = initial ?? prefill ?? {}
  const [kind, setKind] = useState<PurchaseKind>((start.kind as PurchaseKind) ?? (order ? "NO_GST" : "BILL"))
  const [category, setCategory] = useState<PurchaseCategory>((start.category as PurchaseCategory) ?? (order ? "STITCHING" : "FABRIC"))
  const [date, setDate] = useState(initial ? istDay(initial.date) : prefill?.date ?? today())
  const [supplierName, setSupplierName] = useState(start.supplierName ?? "")
  const [gstin, setGstin] = useState(start.supplierGstin ?? "")
  const [billNumber, setBillNumber] = useState(start.billNumber ?? "")
  const [description, setDescription] = useState(start.description ?? "")
  const [taxable, setTaxable] = useState(rupees(start.taxableValue))
  const [rate, setRate] = useState(() => {
    const tax = (start.igst ?? 0) + (start.cgst ?? 0) + (start.sgst ?? 0)
    if (!start.taxableValue || !tax) return 5
    const r = (tax / start.taxableValue) * 100
    return RATES.reduce((best, x) => (Math.abs(x - r) < Math.abs(best - r) ? x : best), 5)
  })
  const [igst, setIgst] = useState(rupees(start.igst))
  const [cgst, setCgst] = useState(rupees(start.cgst))
  const [sgst, setSgst] = useState(rupees(start.sgst))
  const [claimItc, setClaimItc] = useState(initial ? initial.claimItc : true)
  const [orderCode, setOrderCode] = useState(order?.orderCode ?? initial?.orderCode ?? initial?.order?.orderCode ?? "")
  const [challanNumber, setChallanNumber] = useState(initial?.challanNumber ?? initial?.challan?.number ?? "")
  const [note, setNote] = useState(initial?.note ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const gst = kind !== "NO_GST"
  const state = useMemo(() => {
    const g = normaliseGstin(gstin)
    return /^\d{2}/.test(g) ? g.slice(0, 2) : null
  }, [gstin])
  const intra = state ? state === business.stateCode : true

  const applyRate = (r: number, base = taxable, isIntra = intra) => {
    const tax = Math.round((paise(base) * r) / 100)
    if (isIntra) {
      const half = Math.round(tax / 2)
      setCgst(rupees(half))
      setSgst(rupees(tax - half))
      setIgst("")
    } else {
      setIgst(rupees(tax))
      setCgst("")
      setSgst("")
    }
  }

  const total = paise(taxable) + (gst ? (intra ? paise(cgst) + paise(sgst) : paise(igst)) : 0)

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      const body = {
        kind,
        category,
        date,
        supplierName,
        supplierGstin: gstin,
        billNumber,
        description,
        taxableValue: paise(taxable),
        igst: gst && !intra ? paise(igst) : 0,
        cgst: gst && intra ? paise(cgst) : 0,
        sgst: gst && intra ? paise(sgst) : 0,
        claimItc: gst ? claimItc : false,
        note,
        orderCode,
        challanNumber,
      }
      const saved = await adminFetch<AdminPurchase>(initial ? `/api/admin/purchases/${initial.id}` : "/api/admin/purchases", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      onSaved(saved)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the entry")
    } finally {
      setSaving(false)
    }
  }

  const field = (id: string, text: string, value: string, set: (v: string) => void, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={id} className={label}>{text}</label>
      <input id={id} value={value} onChange={(e) => set(e.target.value)} className={`${input} mt-2 w-full`} {...props} />
    </div>
  )

  return (
    <Dialog
      open
      size="lg"
      onClose={onClose}
      title={initial ? "Edit entry" : "New purchase or expense"}
      description="Enter the details as printed on the bill. GST bills are matched against GSTR-2B when you upload it."
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary} disabled={saving}>Cancel</button>
          <button type="button" onClick={submit} className={btn.primary} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <div className="space-y-5 font-jost text-sm">
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

        <div role="radiogroup" aria-label="Type" className="grid gap-2 sm:grid-cols-3">
          {PURCHASE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={`rounded-lg border px-3 py-2.5 text-left font-semibold transition-colors ${kind === k ? "border-black bg-black/[0.03]" : "border-black/15 hover:border-black"}`}
            >
              {PURCHASE_KIND_LABEL[k]}
              <span className="block text-xs font-normal text-black/55">
                {k === "BILL" ? "From a GST-registered seller" : k === "CREDIT_NOTE" ? "A seller reduced an earlier bill" : "Tailor's labour, unregistered sellers"}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pur-cat" className={label}>For</label>
            <select id="pur-cat" value={category} onChange={(e) => setCategory(e.target.value as PurchaseCategory)} className={`${input} mt-2 w-full`}>
              {PURCHASE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{PURCHASE_CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>
          {field("pur-date", gst ? "Bill date" : "Date paid", date, setDate, { type: "date", max: today() })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("pur-supplier", kind === "NO_GST" && category === "STITCHING" ? "Tailor or supplier" : "Supplier", supplierName, setSupplierName, { placeholder: "Name on the bill" })}
          <div>
            <label htmlFor="pur-gstin" className={label}>Supplier GSTIN{gst ? "" : " (if any)"}</label>
            <input
              id="pur-gstin"
              value={gstin}
              onChange={(e) => {
                const next = e.target.value.toUpperCase()
                const g = normaliseGstin(next)
                const nextIntra = /^\d{2}/.test(g) ? g.slice(0, 2) === business.stateCode : true
                if (nextIntra !== intra) {
                  const tax = nextIntra ? paise(igst) : paise(cgst) + paise(sgst)
                  const half = Math.round(tax / 2)
                  setIgst(nextIntra ? "" : rupees(tax))
                  setCgst(nextIntra ? rupees(half) : "")
                  setSgst(nextIntra ? rupees(tax - half) : "")
                }
                setGstin(next)
              }}
              className={`${input} mt-2 w-full`}
              placeholder="15 characters"
            />
            {state && gst && <p className="mt-1 text-xs text-black/55">{placeOfSupplyLabel(state)}: {intra ? "CGST and SGST" : "IGST"}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {field("pur-bill", kind === "CREDIT_NOTE" ? "Credit note number" : `Bill number${gst ? "" : " (if any)"}`, billNumber, setBillNumber, { maxLength: 16 })}
          {field("pur-desc", "What was bought", description, setDescription, { placeholder: "e.g. Silk crepe, blush, 3 m" })}
        </div>

        <div className="rounded-lg border border-black/10 p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pur-taxable" className={label}>{gst ? "Amount before GST (₹)" : "Amount paid (₹)"}</label>
              <input
                id="pur-taxable"
                inputMode="decimal"
                value={taxable}
                onChange={(e) => {
                  setTaxable(e.target.value)
                  if (gst) applyRate(rate, e.target.value)
                }}
                className={`${input} mt-2 w-full text-right`}
              />
            </div>
            {gst && (
              <div>
                <label htmlFor="pur-rate" className={label}>GST rate</label>
                <select
                  id="pur-rate"
                  value={rate}
                  onChange={(e) => {
                    setRate(Number(e.target.value))
                    applyRate(Number(e.target.value))
                  }}
                  className={`${input} mt-2 w-full`}
                >
                  {RATES.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
              </div>
            )}
            <div className="sm:text-right">
              <p className={label}>Bill total</p>
              <p className="mt-3 text-base font-semibold tabular-nums">{formatRupeesExact(total)}</p>
            </div>
          </div>
          {gst && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {intra ? (
                <>
                  {field("pur-cgst", "CGST (₹)", cgst, setCgst, { inputMode: "decimal" })}
                  {field("pur-sgst", "SGST (₹)", sgst, setSgst, { inputMode: "decimal" })}
                </>
              ) : (
                field("pur-igst", "IGST (₹)", igst, setIgst, { inputMode: "decimal" })
              )}
            </div>
          )}
          {gst && <p className="mt-2 text-xs text-black/55">Worked out from the rate. If the bill has items at more than one rate, type the tax amounts from the bill.</p>}
        </div>

        {gst && (
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={claimItc} onChange={(e) => setClaimItc(e.target.checked)} className="mt-1" />
            <span>
              Claim input tax credit on this bill
              <span className="block text-xs text-black/55">Untick for things GST does not allow credit on, such as food or personal use.</span>
            </span>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {order ? (
            <div>
              <p className={label}>Order</p>
              <p className="mt-3 font-semibold">{order.orderCode}</p>
            </div>
          ) : (
            field("pur-order", "Order (optional)", orderCode, (v) => setOrderCode(v.toUpperCase()), { placeholder: "Order code" })
          )}
          {order ? (
            <div>
              <label htmlFor="pur-challan" className={label}>Job work challan (optional)</label>
              <select id="pur-challan" value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} className={`${input} mt-2 w-full`}>
                <option value="">None</option>
                {order.challans.map((c) => (
                  <option key={c.number} value={c.number}>{c.label}</option>
                ))}
              </select>
            </div>
          ) : (
            field("pur-challan", "Job work challan (optional)", challanNumber, setChallanNumber, { placeholder: "JW/26-27/001" })
          )}
        </div>
        {field("pur-note", "Note (optional)", note, setNote)}
      </div>
    </Dialog>
  )
}
