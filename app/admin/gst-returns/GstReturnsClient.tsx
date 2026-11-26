"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Card, Dialog, Skeleton, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { formatRupeesExact } from "@/lib/money"
import { IST_OFFSET_MS, fyLabel } from "@/lib/gst/period"
import { placeOfSupplyLabel } from "@/lib/gst/states"
import { addHeads, clampHeads, roundRupees, setOff, subHeads, type Heads } from "@/lib/gst/taxHeads"

type Sales = { invoices: number; creditNotes: number; b2b: number; taxableValue: number; tax: Heads; interState: { pos: string; taxableValue: number; igst: number }[] }
type SetOff = { liability: Heads; credit: Heads; creditUsed: Heads; creditLeft: Heads; cash: Heads }
type ItcSource = "saved" | "gstr2b" | "register" | "none"

function ItcSourceNote({ d, filed, onReset, busy }: { d: Extract<Details, { kind: "PMT06" | "GSTR3B" }>; filed: boolean; onReset: () => void; busy: boolean }) {
  const differs = HEADS.some((h) => d.suggested[h] !== d.itc[h])
  const from =
    d.kind === "GSTR3B" && d.gstr2bLoaded
      ? "the bills in the purchase register that match GSTR-2B"
      : d.registerBills
        ? `the ${d.registerBills} GST ${d.registerBills === 1 ? "bill" : "bills"} in the purchase register${d.kind === "GSTR3B" ? " (GSTR-2B not uploaded yet, so not checked)" : ""}`
        : null
  return (
    <p className="mt-2 text-xs text-black/55">
      {d.itcSource === "saved" ? "Credit as you saved it." : from ? `Filled in from ${from}.` : "No GST bills in the purchase register for this period."}{" "}
      {d.itcSource === "saved" && differs && !filed && (
        <>
          The register gives {formatRupeesExact(total(d.suggested))}.{" "}
          <button type="button" onClick={onReset} disabled={busy} className="font-semibold text-black underline underline-offset-2">Use the register figures</button>
        </>
      )}
      {d.kind === "PMT06" && " Under QRMP there is no GSTR-2B for this month: check the bills in IMS on the portal before paying."}
      {" "}<Link href="/admin/purchases" className="underline underline-offset-2">Purchases</Link>
    </p>
  )
}
type Details =
  | { kind: "PMT06"; sales: Sales; itc: Heads; itcSource: ItcSource; suggested: Heads; registerBills: number; carried: Heads; setOff: SetOff; cash: Heads }
  | { kind: "IFF"; b2b: number }
  | { kind: "GSTR1"; sales: Sales; nil: boolean }
  | {
      kind: "GSTR3B"; sales: Sales; itc: Heads; itcSource: ItcSource; suggested: Heads; registerBills: number; gstr2bLoaded: boolean
      setOff: SetOff; cash: Heads; paidMonthly: Heads; balance: Heads; excess: Heads; nil: boolean
    }
  | { kind: "ITC04"; sent: number; received: number }
  | { kind: "GSTR9"; sales: Sales }

type Status = "filed" | "open" | "nothing" | "optional" | "overdue" | "dueSoon" | "upcoming"

type Row = {
  kind: Details["kind"]
  title: string
  period: string
  label: string
  quarter: number | null
  from: string
  to: string
  activeFrom: string
  due: string
  daysLeft: number
  status: Status
  optional: boolean
  filing: { filedAt: string | null; reference: string | null; note: string | null; itc: Heads; paid: Heads } | null
  changedSinceFiled: boolean
  link: string | null
  details: Details
}

type Data = { fyStart: number; years: number[]; registeredOn: string; gstin: string; stateCode: string; annualReturnOptional: boolean; returns: Row[] }

const ZERO: Heads = { igst: 0, cgst: 0, sgst: 0 }
const total = (h: Heads) => h.igst + h.cgst + h.sgst
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })
const inputDate = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
const toRupeesText = (paise: number) => (paise ? String(paise / 100) : "")
const toPaise = (text: string) => {
  const n = Number(text.replace(/,/g, "").trim())
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}
const rowKey = (r: Pick<Row, "kind" | "period">) => `${r.kind}|${r.period}`
const HEADS = ["igst", "cgst", "sgst"] as const
const HEAD_LABEL = { igst: "IGST", cgst: "CGST", sgst: "SGST" }
const label = "block font-jost text-xs font-semibold uppercase tracking-[0.12em] text-black/60"

function statusBadge(r: Row) {
  const tone = {
    filed: "bg-emerald-50 text-emerald-800",
    open: "bg-stone-100 text-black/60",
    nothing: "bg-stone-100 text-black/60",
    optional: "bg-stone-100 text-black/60",
    overdue: "bg-red-50 text-red-800",
    dueSoon: "bg-amber-50 text-amber-900",
    upcoming: "border border-black/10 text-black/70",
  }[r.status]
  const text = {
    filed: `Filed ${r.filing?.filedAt ? day(r.filing.filedAt) : ""}`,
    open: "Period running",
    nothing: r.kind === "PMT06" ? "Nothing to pay" : "Nothing to report",
    optional: "Optional",
    overdue: `Overdue by ${1 - r.daysLeft} ${1 - r.daysLeft === 1 ? "day" : "days"}`,
    dueSoon: r.daysLeft <= 1 ? "Due today" : `Due in ${r.daysLeft} days`,
    upcoming: `Due ${day(r.due)}`,
  }[r.status]
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 font-jost text-xs font-semibold ${tone}`}>{text}</span>
}

function HeadsRow({ name, value, strong }: { name: string; value: Heads; strong?: boolean }) {
  return (
    <tr className={strong ? "font-semibold" : ""}>
      <th scope="row" className="py-1.5 pr-4 text-left font-normal text-black/70">{name}</th>
      {HEADS.map((h) => (
        <td key={h} className="py-1.5 pl-4 text-right tabular-nums">{formatRupeesExact(value[h])}</td>
      ))}
      <td className="py-1.5 pl-4 text-right tabular-nums">{formatRupeesExact(total(value))}</td>
    </tr>
  )
}

function HeadsTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] font-jost text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs uppercase tracking-[0.12em] text-black/50">
            <th />
            {HEADS.map((h) => (
              <th key={h} className="py-1.5 pl-4 text-right font-semibold">{HEAD_LABEL[h]}</th>
            ))}
            <th className="py-1.5 pl-4 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">{children}</tbody>
      </table>
    </div>
  )
}

function HeadsInput({ name, value, onChange, disabled }: { name: string; value: Record<string, string>; onChange: (v: Record<string, string>) => void; disabled?: boolean }) {
  return (
    <tr>
      <th scope="row" className="py-1.5 pr-4 text-left font-normal text-black/70">{name}</th>
      {HEADS.map((h) => (
        <td key={h} className="py-1.5 pl-4 text-right">
          <input
            inputMode="decimal"
            value={value[h] ?? ""}
            onChange={(e) => onChange({ ...value, [h]: e.target.value })}
            disabled={disabled}
            placeholder="0"
            aria-label={`${name}, ${HEAD_LABEL[h]} in rupees`}
            className={`${input} w-28 text-right disabled:bg-stone-50`}
          />
        </td>
      ))}
      <td className="py-1.5 pl-4 text-right tabular-nums text-black/60">{formatRupeesExact(HEADS.reduce((n, h) => n + toPaise(value[h] ?? ""), 0))}</td>
    </tr>
  )
}

const headsText = (h: Heads): Record<string, string> => ({ igst: toRupeesText(h.igst), cgst: toRupeesText(h.cgst), sgst: toRupeesText(h.sgst) })
const headsPaise = (t: Record<string, string>): Heads => ({ igst: toPaise(t.igst ?? ""), cgst: toPaise(t.cgst ?? ""), sgst: toPaise(t.sgst ?? "") })

function live(d: Details, itc: Record<string, string> | undefined) {
  if (d.kind !== "PMT06" && d.kind !== "GSTR3B") return null
  const credit = itc ? headsPaise(itc) : d.itc
  const so = setOff(d.setOff.liability, d.kind === "PMT06" ? addHeads(credit, d.carried) : credit)
  const cash = roundRupees(so.cash)
  const paidMonthly = d.kind === "GSTR3B" ? d.paidMonthly : { igst: 0, cgst: 0, sgst: 0 }
  return {
    credit,
    setOff: so,
    cash,
    balance: clampHeads(subHeads(cash, paidMonthly)),
    excess: clampHeads(subHeads(paidMonthly, cash)),
    pay: d.kind === "PMT06" ? cash : clampHeads(subHeads(cash, paidMonthly)),
  }
}

function SalesSummary({ s }: { s: Sales }) {
  return (
    <dl className="grid grid-cols-2 gap-4 font-jost text-sm sm:grid-cols-4">
      {[
        ["Invoices", String(s.invoices)],
        ["Credit notes", String(s.creditNotes)],
        ["Taxable value", formatRupeesExact(s.taxableValue)],
        ["GST", formatRupeesExact(total(s.tax))],
      ].map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-[0.12em] text-black/50">{k}</dt>
          <dd className="mt-1 font-semibold tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <details className="rounded-lg bg-stone-50 p-3 font-jost text-sm text-black/75">
      <summary className="cursor-pointer font-semibold text-black">How to file on gst.gov.in</summary>
      <ol className="mt-2 list-decimal space-y-1 pl-5">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </details>
  )
}

const STEPS: Record<Details["kind"], string[]> = {
  PMT06: [
    "Sign in on gst.gov.in and open Returns Dashboard. Choose the financial year, the quarter and this month.",
    "In the Payment of tax (PMT-06) tile choose Create challan, then Self-assessment method.",
    "Enter the IGST, CGST and SGST shown under Pay in cash (tax column), generate the challan and pay by net banking or UPI.",
    "Record the payment here with the CIN printed on the paid challan.",
  ],
  IFF: [
    "On the Returns Dashboard choose the quarter and this month, then Invoice Furnishing Facility (IFF).",
    "Add the B2B invoices of the month (or upload them with the GST Offline Tool) and file with EVC.",
    "Invoices filed in IFF are not repeated in the quarter's GSTR-1.",
  ],
  GSTR1: [
    "Download the GSTR-1 file for the quarter from Records (or file a nil return if there were no sales).",
    "On the Returns Dashboard choose the financial year and the quarter, then GSTR-1, Prepare Offline, Upload, and select the file.",
    "Check the tables under Prepare Online, generate the summary and file with EVC (OTP to the registered mobile).",
    "Record the ARN here.",
  ],
  GSTR3B: [
    "File GSTR-1 for the quarter first: its figures fill GSTR-3B on the portal.",
    "On the Returns Dashboard choose the quarter, then GSTR-3B. Check tables 3.1 and 3.2 against this page and enter the input tax credit in table 4 from GSTR-2B.",
    "Proceed to payment. The PMT-06 amounts are in the cash ledger; pay any balance shown here by challan, then offset the liability.",
    "File with EVC and record the ARN here.",
  ],
  ITC04: [
    "Download the ITC-04 Excel for the whole year from Records.",
    "On gst.gov.in open Services, Returns, ITC Forms, then ITC-04. Prepare it in the ITC-04 offline tool from the Downloads section with the rows from the workbook, and upload the file.",
    "File with EVC and record the ARN here.",
  ],
  GSTR9: [
    "GSTR-9 is optional while turnover for the year is up to ₹2 crore. If you file it, it opens on the Returns Dashboard under Annual return.",
    "Check the figures filled in from GSTR-1 and GSTR-3B against the year totals here and file with EVC.",
  ],
}

export default function GstReturnsClient() {
  const [fy, setFy] = useState<number | null>(null)
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [itc, setItc] = useState<Record<string, Record<string, string>>>({})
  const [filing, setFiling] = useState<Row | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const apply = useCallback((d: Data) => {
    setData(d)
    setItc(Object.fromEntries(d.returns.filter((r) => r.details.kind === "PMT06" || r.details.kind === "GSTR3B").map((r) => [rowKey(r), headsText((r.details as { itc: Heads }).itc)])))
  }, [])

  const load = useCallback(async (year: number | null) => {
    setError(null)
    try {
      const d = await adminFetch<Data>(`/api/admin/gst-returns${year ? `?fy=${year}` : ""}`)
      apply(d)
      setFy(d.fyStart)
      setOpen((s) => (s.size ? s : new Set(d.returns.filter((r) => ["overdue", "dueSoon"].includes(r.status)).map(rowKey))))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the GST returns")
    }
  }, [apply])

  useEffect(() => {
    load(null)
  }, [load])

  const save = async (body: Record<string, unknown>, done: string) => {
    setError(null)
    setBusy(String(body.kind) + "|" + String(body.period))
    try {
      apply(await adminFetch<Data>("/api/admin/gst-returns", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))
      setFlash(done)
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save")
      return false
    } finally {
      setBusy(null)
    }
  }

  const groups = useMemo(() => {
    if (!data) return []
    const out: { title: string; rows: Row[] }[] = []
    for (const q of [1, 2, 3, 4]) {
      const rows = data.returns.filter((r) => r.quarter === q)
      if (rows.length) out.push({ title: `Q${q}`, rows })
    }
    const year = data.returns.filter((r) => r.quarter === null)
    if (year.length) out.push({ title: `Year ${fyLabel(data.fyStart)}`, rows: year })
    return out
  }, [data])

  const next = data?.returns.find((r) => ["overdue", "dueSoon", "upcoming", "open"].includes(r.status) && !r.optional)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="GST returns"
        description={data ? `GSTIN ${data.gstin} · quarterly returns with monthly tax payment (QRMP) · registered ${day(data.registeredOn)}` : "Returns and tax payments due, and a record of each filing."}
        actions={
          data && data.years.length > 1 ? (
            <select className={input} value={fy ?? ""} onChange={(e) => load(Number(e.target.value))} aria-label="Financial year">
              {data.years.map((y) => (
                <option key={y} value={y}>FY {fyLabel(y)}</option>
              ))}
            </select>
          ) : null
        }
      />

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
      {flash && (
        <Alert tone="success" onDismiss={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <Alert tone="info">
        Returns are filed on gst.gov.in with the OTP sent to the registered mobile. This page works out what each return and payment should contain from the site&apos;s invoices and credit notes, and keeps a record of each one filed. Input tax credit comes from the purchase register, checked against GSTR-2B once you upload it on the Purchases page.
      </Alert>

      {!data ? (
        <Card>
          <div className="space-y-3">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-16" />
          </div>
        </Card>
      ) : (
        <>
          {next && (
            <Card title="Next due">
              <div className="flex flex-wrap items-center justify-between gap-3 font-jost">
                <div>
                  <p className="text-base font-semibold">{next.title} · {next.label}</p>
                  <p className="text-sm text-black/60">Due {day(next.due)}</p>
                </div>
                {statusBadge(next)}
              </div>
            </Card>
          )}

          {groups.map((g) => (
            <section key={g.title} className="space-y-3">
              <h2 className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-black/60">{g.title}</h2>
              {g.rows.map((r) => {
                const k = rowKey(r)
                const isOpen = open.has(k)
                return (
                  <div key={k} className={`rounded-xl border bg-white ${r.status === "overdue" ? "border-red-200" : r.status === "dueSoon" ? "border-amber-300" : "border-black/10"}`}>
                    <button
                      type="button"
                      onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })}
                      className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left font-jost"
                      aria-expanded={isOpen}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{r.title}</span>
                        <span className="block text-xs text-black/55">
                          {r.label}
                          {r.activeFrom !== r.from ? ` (from ${day(r.activeFrom)})` : ""} · due {day(r.due)}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        {statusBadge(r)}
                        <ChevronDown className={`h-4 w-4 text-black/50 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="space-y-4 border-t border-black/10 px-5 py-4 font-jost text-sm">
                        <Worksheet
                          row={r}
                          itc={itc[k] ?? {}}
                          setItc={(v) => setItc((m) => ({ ...m, [k]: v }))}
                          busy={busy === k}
                          onSaveItc={() => save({ kind: r.kind, period: r.period, itc: headsPaise(itc[k] ?? {}) }, `${r.title}, ${r.label}: input tax credit saved.`)}
                          onResetItc={() => save({ kind: r.kind, period: r.period, resetItc: true }, `${r.title}, ${r.label}: credit taken from the purchase register.`)}
                          onFile={() => setFiling(r)}
                          onUndo={() => save({ kind: r.kind, period: r.period, filed: false }, `${r.title}, ${r.label}: marked not filed.`)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </section>
          ))}
        </>
      )}

      {filing && (
        <FileDialog
          row={filing}
          itc={itc[rowKey(filing)]}
          onClose={() => setFiling(null)}
          onSubmit={async (body) => {
            const ok = await save(body, `${filing.title}, ${filing.label}: ${filing.kind === "PMT06" ? "payment recorded" : "marked filed"}.`)
            if (ok) setFiling(null)
          }}
        />
      )}
    </div>
  )
}

function Worksheet({
  row: r,
  itc,
  setItc,
  busy,
  onSaveItc,
  onResetItc,
  onFile,
  onUndo,
}: {
  row: Row
  itc: Record<string, string>
  setItc: (v: Record<string, string>) => void
  busy: boolean
  onSaveItc: () => void
  onResetItc: () => void
  onFile: () => void
  onUndo: () => void
}) {
  const d = r.details
  const filed = r.status === "filed"
  const periodOver = r.status !== "open"
  const now = live(d, filed ? undefined : itc)

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {filed ? (
        <>
          <p className="text-sm text-emerald-800">
            {r.kind === "PMT06" ? "Paid" : "Filed"} on {day(r.filing!.filedAt!)}
            {r.filing?.reference ? ` · ${r.kind === "PMT06" ? "CIN" : "ARN"} ${r.filing.reference}` : ""}
            {(r.kind === "PMT06" || r.kind === "GSTR3B") && r.filing ? ` · cash paid ${formatRupeesExact(total(r.filing.paid))}` : ""}
          </p>
          <button type="button" onClick={onUndo} disabled={busy} className={`${btn.ghost} !px-3 !py-1.5 !text-xs`}>Undo</button>
        </>
      ) : (
        <>
          {(d.kind === "PMT06" || d.kind === "GSTR3B") && (
            <button type="button" onClick={onSaveItc} disabled={busy} className={`${btn.secondary} !px-3 !py-1.5 !text-xs`}>
              {busy ? "Saving…" : "Save input tax credit"}
            </button>
          )}
          <button
            type="button"
            onClick={onFile}
            disabled={busy || !periodOver}
            title={periodOver ? undefined : "The period has not ended yet"}
            className={`${btn.primary} !px-3 !py-1.5 !text-xs`}
          >
            {r.kind === "PMT06" ? "Record payment" : "Mark filed"}
          </button>
        </>
      )}
    </div>
  )

  const changed = r.changedSinceFiled && (
    <Alert tone="info">The sales for this period have changed since it was filed. Correct the difference in the next return, or ask your CA.</Alert>
  )

  if (d.kind === "PMT06" && now) {
    const liability = d.setOff.liability
    return (
      <>
        <p className="text-black/70">Tax on the invoices dated in {r.label}, less credit notes, after input tax credit. Under the self-assessment method only what credit does not cover is paid by challan.</p>
        <HeadsTable>
          <HeadsRow name="Tax on sales" value={liability} />
          <HeadsInput name="Input tax credit (from GSTR-2B)" value={itc} onChange={setItc} disabled={filed} />
          {total(d.carried) > 0 && <HeadsRow name="Credit carried from last month" value={d.carried} />}
          <HeadsRow name="Paid from credit" value={now.setOff.creditUsed} />
          <HeadsRow name="Pay in cash (PMT-06)" value={now.cash} strong />
        </HeadsTable>
        <ItcSourceNote d={d} filed={filed} onReset={onResetItc} busy={busy} />
        {total(now.cash) === 0 && (
          <p className="text-black/70">No tax to pay for this month, so no PMT-06 challan is needed. Any tax is settled with the quarter&apos;s GSTR-3B.</p>
        )}
        {changed}
        {actions}
        <Steps items={STEPS.PMT06} />
      </>
    )
  }

  if (d.kind === "IFF") {
    return (
      <>
        <p className="text-black/70">
          {d.b2b} B2B {d.b2b === 1 ? "invoice" : "invoices"} this month. IFF is optional: it lets business buyers claim their credit before the quarter ends. If you skip it, these invoices go in the quarter&apos;s GSTR-1 as usual.
        </p>
        {actions}
        <Steps items={STEPS.IFF} />
      </>
    )
  }

  if (d.kind === "GSTR1") {
    return (
      <>
        <SalesSummary s={d.sales} />
        {d.nil ? (
          <p className="text-black/70">No invoices or credit notes in the quarter: file a nil GSTR-1, on the portal or by SMS to 14409 from the registered mobile.</p>
        ) : (
          r.link && (
            <Link href={r.link} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4">
              Prepare the GSTR-1 file in Records <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )
        )}
        {changed}
        {actions}
        <Steps items={STEPS.GSTR1} />
      </>
    )
  }

  if (d.kind === "GSTR3B" && now) {
    return (
      <>
        <div>
          <p className={label}>3.1 (a) Outward taxable supplies</p>
          <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Taxable value", d.sales.taxableValue],
              ["IGST", d.sales.tax.igst],
              ["CGST", d.sales.tax.cgst],
              ["SGST", d.sales.tax.sgst],
            ].map(([k, v]) => (
              <div key={k as string}>
                <dt className="text-xs uppercase tracking-[0.12em] text-black/50">{k}</dt>
                <dd className="mt-1 font-semibold tabular-nums">{formatRupeesExact(v as number)}</dd>
              </div>
            ))}
          </dl>
        </div>
        {d.sales.interState.length > 0 && (
          <div>
            <p className={label}>3.2 Inter-state supplies to unregistered buyers</p>
            <table className="mt-2 w-full max-w-lg text-sm">
              <tbody className="divide-y divide-black/5">
                {d.sales.interState.map((s) => (
                  <tr key={s.pos}>
                    <td className="py-1.5 text-black/70">{placeOfSupplyLabel(s.pos)}</td>
                    <td className="py-1.5 text-right tabular-nums">{formatRupeesExact(s.taxableValue)}</td>
                    <td className="py-1.5 pl-4 text-right tabular-nums">IGST {formatRupeesExact(s.igst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div>
          <p className={label}>4 and 6.1 Input tax credit and payment</p>
          <div className="mt-2">
            <HeadsTable>
              <HeadsRow name="Tax payable" value={d.setOff.liability} />
              <HeadsInput name="Input tax credit for the quarter (from GSTR-2B)" value={itc} onChange={setItc} disabled={filed} />
              <HeadsRow name="Paid from credit" value={now.setOff.creditUsed} />
              <HeadsRow name="Cash needed" value={now.cash} />
              <HeadsRow name="Already paid with PMT-06" value={d.paidMonthly} />
              <HeadsRow name="Pay now with GSTR-3B" value={now.balance} strong />
            </HeadsTable>
          </div>
          <ItcSourceNote d={d} filed={filed} onReset={onResetItc} busy={busy} />
          {total(now.excess) > 0 && (
            <p className="mt-2 text-xs text-black/55">{formatRupeesExact(total(now.excess))} paid with PMT-06 is more than needed. It stays in the electronic cash ledger for the next quarter.</p>
          )}
        </div>
        {d.nil && total(now.credit) === 0 && <p className="text-black/70">No sales and no input tax credit in the quarter: file a nil GSTR-3B, on the portal or by SMS to 14409 from the registered mobile.</p>}
        {changed}
        {actions}
        <Steps items={STEPS.GSTR3B} />
      </>
    )
  }

  if (d.kind === "ITC04") {
    return (
      <>
        <p className="text-black/70">
          {d.sent} job work {d.sent === 1 ? "challan" : "challans"} issued and {d.received} received back in the year.
          {r.status === "nothing" ? " No goods were sent to tailors on job work, so there is nothing to report. Confirm with your CA whether a nil return is wanted." : ""}
        </p>
        {r.link && d.sent + d.received > 0 && (
          <Link href={r.link} className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4">
            Download the ITC-04 Excel in Records <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        {actions}
        <Steps items={STEPS.ITC04} />
      </>
    )
  }

  return (
    <>
      <SalesSummary s={d.sales} />
      {r.optional && <p className="text-black/70">Optional: GSTR-9 need not be filed while the year&apos;s turnover is up to ₹2 crore. Check the current notification with your CA each year.</p>}
      {changed}
      {actions}
      <Steps items={STEPS.GSTR9} />
    </>
  )
}

function FileDialog({ row: r, itc, onClose, onSubmit }: { row: Row; itc?: Record<string, string>; onClose: () => void; onSubmit: (body: Record<string, unknown>) => Promise<void> }) {
  const d = r.details
  const pays = d.kind === "PMT06" || d.kind === "GSTR3B"
  const computed = live(d, itc)?.pay ?? ZERO
  const today = inputDate(new Date())
  const min = inputDate(new Date(r.to))
  const [date, setDate] = useState(today < min ? min : today)
  const [reference, setReference] = useState("")
  const [paid, setPaid] = useState<Record<string, string>>(headsText(computed))
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    await onSubmit({
      kind: r.kind,
      period: r.period,
      filed: true,
      filedOn: date,
      reference,
      ...(pays ? { paid: headsPaise(paid), ...(itc ? { itc: headsPaise(itc) } : {}) } : {}),
    })
    setSaving(false)
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size={pays ? "lg" : "md"}
      title={r.kind === "PMT06" ? "Record payment" : "Mark filed"}
      description={`${r.title}, ${r.label}`}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary} disabled={saving}>Cancel</button>
          <button type="button" onClick={submit} className={btn.primary} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <div className="space-y-4 font-jost text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="file-date" className={label}>{r.kind === "PMT06" ? "Date paid" : "Date filed"}</label>
            <input id="file-date" type="date" value={date} min={min} max={today} onChange={(e) => setDate(e.target.value)} className={`${input} mt-2 w-full`} />
          </div>
          <div>
            <label htmlFor="file-ref" className={label}>{r.kind === "PMT06" ? "CIN (on the paid challan)" : "ARN (optional)"}</label>
            <input id="file-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={`${input} mt-2 w-full`} />
          </div>
        </div>
        {pays && (
          <div>
            <p className={label}>{r.kind === "PMT06" ? "Amount paid" : "Cash paid with this return"}</p>
            <div className="mt-2">
              <HeadsTable>
                <HeadsInput name="Paid in cash" value={paid} onChange={setPaid} />
              </HeadsTable>
            </div>
            <p className="mt-2 text-xs text-black/55">Filled in with the amount worked out on the page. Change it if a different amount was paid.</p>
          </div>
        )}
      </div>
    </Dialog>
  )
}
