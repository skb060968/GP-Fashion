"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Pencil, Plus, Trash2, Upload } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Card, EmptyRow, Skeleton, btn, input } from "@/components/admin/ui"
import PurchaseDialog, { type AdminPurchase, type PurchasePrefill } from "@/components/admin/PurchaseDialog"
import { adminFetch } from "@/lib/admin/fetch"
import { formatRupeesExact } from "@/lib/money"
import { QUARTER_MONTHS, currentFyStart, currentQuarter, fyLabel, type Quarter } from "@/lib/gst/period"
import { PURCHASE_CATEGORY_LABEL, PURCHASE_KIND_LABEL, type PurchaseCategory, type PurchaseKind } from "@/lib/purchases/purchases"

type Heads = { igst: number; cgst: number; sgst: number }
type Doc = { section: "B2B" | "CDNR"; noteType: "C" | "D" | null; ctin: string; supplier: string; number: string; date: string; value: number; taxableValue: number; igst: number; cgst: number; sgst: number; itcAvailable: boolean; reason: string | null }
type MatchStatus = "matched" | "differs" | "unavailable" | "awaiting" | "noCredit"
type Row = AdminPurchase & { orderCode: string | null; challanNumber: string | null; total: number; cost: number; match: { status: MatchStatus; period: string | null; doc: Doc | null } | null }

type Data = {
  period: { fyStart: number; quarter: Quarter | null; label: string }
  years: number[]
  gstin: string
  purchases: Row[]
  summary: { bills: number; expenses: number; itcInRegister: Heads; itcMatched: Heads; total: number; cost: number }
  imports: { period: string; generatedOn: string | null; fileName: string | null; importedAt: string; docs: number; other: { section: string; count: number }[] | null }[]
  notInRegister: (Doc & { period: string })[]
}

const total = (h: Heads) => h.igst + h.cgst + h.sgst
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const monthLabel = (p: string) => `${MONTHS[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`

const STATUS: Record<MatchStatus, { text: string; tone: string }> = {
  matched: { text: "In GSTR-2B", tone: "bg-emerald-50 text-emerald-800" },
  differs: { text: "Amount differs in GSTR-2B", tone: "bg-amber-50 text-amber-900" },
  unavailable: { text: "In GSTR-2B, credit not available", tone: "bg-red-50 text-red-800" },
  awaiting: { text: "Not in GSTR-2B yet", tone: "bg-stone-100 text-black/65" },
  noCredit: { text: "No credit", tone: "border border-black/10 text-black/55" },
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-jost text-xs uppercase tracking-[0.14em] text-black/50">{label}</p>
      <p className="mt-1 font-jost text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export default function PurchasesClient() {
  const [fy, setFy] = useState(currentFyStart())
  const [q, setQ] = useState<string>(String(currentQuarter()))
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ initial?: AdminPurchase; prefill?: PurchasePrefill } | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminFetch<Data>(`/api/admin/purchases?fy=${fy}&q=${q}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the purchases")
    } finally {
      setLoading(false)
    }
  }, [fy, q])

  useEffect(() => {
    load()
  }, [load])

  const upload = async (file: File) => {
    setError(null)
    setFlash(null)
    setUploading(true)
    try {
      const content = await file.text()
      const r = await adminFetch<{ period: string; docs: number; other: { section: string; count: number }[] }>("/api/admin/purchases/gstr2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, content }),
      })
      setFlash(`GSTR-2B for ${monthLabel(r.period)} read: ${r.docs} ${r.docs === 1 ? "document" : "documents"} from suppliers.${r.other.length ? ` Other sections (${r.other.map((o) => `${o.section} ${o.count}`).join(", ")}) are not matched here; check them on the portal.` : ""}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const removeImport = async (period: string) => {
    if (!window.confirm(`Remove the GSTR-2B for ${monthLabel(period)}? The register entries stay; only the matching is undone.`)) return
    try {
      await adminFetch(`/api/admin/purchases/gstr2b?period=${period}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" })
      setFlash(`GSTR-2B for ${monthLabel(period)} removed.`)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove it")
    }
  }

  const remove = async (p: Row) => {
    if (!window.confirm(`Delete ${p.billNumber ? `bill ${p.billNumber}` : "this entry"} from ${p.supplierName}?`)) return
    try {
      await adminFetch(`/api/admin/purchases/${p.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" })
      setFlash("Entry deleted.")
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete it")
    }
  }

  const s = data?.summary
  const latestImport = data?.imports.reduce<string | null>((m, i) => (m && m > i.period ? m : i.period), null) ?? null
  const billMonth = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7)
  const attention =
    data?.purchases.filter(
      (p) => p.match && (["differs", "unavailable"].includes(p.match.status) || (p.match.status === "awaiting" && latestImport !== null && billMonth(p.date) <= latestImport)),
    ) ?? []

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Purchases"
        description="Purchase bills and other expenses, matched against GSTR-2B for input tax credit."
        actions={
          <button type="button" onClick={() => setDialog({})} className={btn.primary}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden /> New entry
          </button>
        }
      />

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
      {flash && (
        <Alert tone="success" onDismiss={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <Card title="Period">
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-col gap-1.5 font-jost text-sm font-medium">
            Financial year
            <select className={input} value={fy} onChange={(e) => setFy(Number(e.target.value))}>
              {(data?.years ?? [fy]).map((y) => (
                <option key={y} value={y}>FY {fyLabel(y)}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 font-jost text-sm font-medium">
            Quarter
            <select className={input} value={q} onChange={(e) => setQ(e.target.value)}>
              {([1, 2, 3, 4] as Quarter[]).map((n) => (
                <option key={n} value={n}>Q{n} ({QUARTER_MONTHS[n]})</option>
              ))}
              <option value="all">Whole year</option>
            </select>
          </label>
        </div>
      </Card>

      <Card title="Summary">
        {!data || !s ? (
          <Skeleton className="h-12" />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="GST bills" value={String(s.bills)} />
            <Stat label="Expenses without GST" value={String(s.expenses)} />
            <Stat label="Paid in total" value={formatRupeesExact(s.total)} />
            <Stat label="Cost after credit" value={formatRupeesExact(s.cost)} />
            <Stat label="Credit in register" value={formatRupeesExact(total(s.itcInRegister))} />
            <Stat label="Credit in GSTR-2B" value={data.imports.length ? formatRupeesExact(total(s.itcMatched)) : "Not uploaded"} />
          </div>
        )}
      </Card>

      <Card
        title="GSTR-2B"
        action={
          <>
            <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={`${btn.secondary} !px-3 !py-1.5 !text-xs`}>
              <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> {uploading ? "Reading…" : "Upload GSTR-2B (JSON)"}
            </button>
          </>
        }
      >
        <div className="space-y-4 font-jost text-sm">
          <p className="text-black/65">
            After the 14th of the month following each quarter, open the GSTR-2B tile on the Returns Dashboard, download it as JSON and upload it here. Under QRMP, GSTR-2B is made for the quarter only, not for its first two months. Each GST bill is matched by supplier GSTIN and bill number, and the matched credit fills in GSTR-3B on the GST returns page.
          </p>
          {data && data.imports.length === 0 && <p className="text-black/55">No GSTR-2B uploaded for this period.</p>}
          {data?.imports.map((i) => (
            <div key={i.period} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-3 py-2">
              <span>
                <span className="font-semibold">GSTR-2B {monthLabel(i.period)}</span>
                <span className="text-black/55"> · {i.docs} {i.docs === 1 ? "document" : "documents"}{i.generatedOn ? ` · generated ${i.generatedOn}` : ""} · uploaded {day(i.importedAt)}</span>
              </span>
              <button type="button" onClick={() => removeImport(i.period)} className={`${btn.ghost} !px-2 !py-1 !text-xs`}>Remove</button>
            </div>
          ))}
          {attention.length > 0 && (
            <div>
              <p className="font-semibold">Bills to look at</p>
              <ul className="mt-1 space-y-1 text-black/75">
                {attention.map((p) => (
                  <li key={p.id}>
                    {p.supplierName}, bill {p.billNumber} ({day(p.date)}):{" "}
                    {p.match?.status === "differs"
                      ? `the amount differs.${p.match.doc ? ` GSTR-2B shows taxable ${formatRupeesExact(p.match.doc.taxableValue)}, GST ${formatRupeesExact(p.match.doc.igst + p.match.doc.cgst + p.match.doc.sgst)}.` : ""} Check the bill and correct the entry, or ask the seller to amend it.`
                      : p.match?.status === "unavailable"
                        ? `in GSTR-2B but credit is not available${p.match.doc?.reason ? ` (${p.match.doc.reason})` : ""}. Not claimed.`
                        : "not in the uploaded GSTR-2B. Ask the seller to report it in their GSTR-1; it can be claimed once it appears."}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data && data.notInRegister.length > 0 && (
            <div>
              <p className="font-semibold">In GSTR-2B but not in the register</p>
              <ul className="mt-1 divide-y divide-black/5">
                {data.notInRegister.map((d) => (
                  <li key={`${d.ctin}|${d.number}|${d.section}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="text-black/75">
                      {d.supplier || d.ctin} · {d.section === "CDNR" ? "credit note" : "bill"} {d.number} · {d.date ? day(d.date) : ""} · taxable {formatRupeesExact(d.taxableValue)}, GST {formatRupeesExact(d.igst + d.cgst + d.sgst)}
                    </span>
                    <button
                      type="button"
                      className={`${btn.secondary} !px-3 !py-1 !text-xs`}
                      onClick={() =>
                        setDialog({
                          prefill: {
                            kind: d.section === "CDNR" && d.noteType === "C" ? "CREDIT_NOTE" : "BILL",
                            supplierName: d.supplier,
                            supplierGstin: d.ctin,
                            billNumber: d.number.slice(0, 16),
                            date: d.date || undefined,
                            taxableValue: d.taxableValue,
                            igst: d.igst,
                            cgst: d.cgst,
                            sgst: d.sgst,
                          },
                        })
                      }
                    >
                      Add to register
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-black/55">If a document is not yours, you can reject it in the Invoice Management System (IMS) on the portal.</p>
            </div>
          )}
        </div>
      </Card>

      <Card title={`Entries${data ? ` · ${data.period.label}` : ""}`} padded={false}>
        {loading && !data ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : data && data.purchases.length === 0 ? (
          <EmptyRow title="No purchases or expenses in this period" hint="Add fabric bills, the tailor's labour and other costs as they come in." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] font-jost text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs uppercase tracking-[0.12em] text-black/50">
                  <th className="px-5 py-2.5 font-semibold">Date</th>
                  <th className="py-2.5 font-semibold">Supplier and bill</th>
                  <th className="py-2.5 font-semibold">For</th>
                  <th className="py-2.5 text-right font-semibold">Before GST</th>
                  <th className="py-2.5 text-right font-semibold">GST</th>
                  <th className="py-2.5 pl-4 font-semibold">Credit</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {data?.purchases.map((p) => {
                  const st = p.match ? STATUS[p.match.status] : null
                  const sign = p.kind === "CREDIT_NOTE" ? -1 : 1
                  return (
                    <tr key={p.id} className="align-top">
                      <td className="whitespace-nowrap px-5 py-3 text-black/70">{day(p.date)}</td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold">{p.supplierName}</p>
                        <p className="text-xs text-black/55">
                          {PURCHASE_KIND_LABEL[p.kind as PurchaseKind]}
                          {p.billNumber ? ` ${p.billNumber}` : ""}
                          {p.supplierGstin ? ` · ${p.supplierGstin}` : ""}
                        </p>
                        <p className="text-xs text-black/55">{p.description}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p>{PURCHASE_CATEGORY_LABEL[p.category as PurchaseCategory]}</p>
                        {p.orderCode && (
                          <Link href={`/admin/orders/${p.orderCode}`} className="text-xs underline underline-offset-4">
                            Order {p.orderCode}
                          </Link>
                        )}
                        {p.challanNumber && <p className="text-xs text-black/55">{p.challanNumber}</p>}
                      </td>
                      <td className="py-3 text-right tabular-nums">{formatRupeesExact(sign * p.taxableValue)}</td>
                      <td className="py-3 text-right tabular-nums">{formatRupeesExact(sign * (p.igst + p.cgst + p.sgst))}</td>
                      <td className="py-3 pl-4">
                        {st && <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${st.tone}`}>{st.text}</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <button type="button" onClick={() => setDialog({ initial: p })} className={`${btn.ghost} !px-2 !py-1`} aria-label="Edit">
                          <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                        </button>
                        <button type="button" onClick={() => remove(p)} className={`${btn.ghost} !px-2 !py-1`} aria-label="Delete">
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {dialog && (
        <PurchaseDialog
          initial={dialog.initial}
          prefill={dialog.prefill}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setFlash(dialog.initial ? "Entry saved." : "Entry added.")
            setDialog(null)
            load()
          }}
        />
      )}
    </div>
  )
}
