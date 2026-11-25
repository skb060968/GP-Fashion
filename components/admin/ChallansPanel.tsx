"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Download, Plus, Trash2 } from "lucide-react"
import { Alert, Card, Dialog, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { business } from "@/lib/data/business"
import { formatRupeesExact } from "@/lib/money"
import { placeOfSupplyLabel } from "@/lib/gst/states"
import {
  GST_RATES,
  ISSUE_STATUSES,
  LINE_KINDS,
  LINE_KIND_LABEL,
  UNITS,
  UNIT_NAME,
  challanSlug,
  challanStatus,
  dueSoon,
  istInputDate,
  parsePieces,
  quantitiesOnChallans,
  receivedNoteFor,
  returnDeadline,
  challanLinesText,
  challanPiecesText,
  type LineKind,
  type Unit,
} from "@/lib/jobwork/challan"
import { challanItems, type OrderItemForChallan } from "@/lib/jobwork/items"

export type AdminChallan = {
  number: string
  date: string
  pieces: unknown
  taxableValue: number
  taxAmount: number
  fabricBill: string | null
  ewayBill: string | null
  note: string | null
  tailorName: string
  tailorStateCode: string
  tailorGstin: string | null
  receivedAt: string | null
  receivedNote: string | null
  receivedEwayBill: string | null
  cancelledAt: string | null
  cancelReason: string | null
  lines: { kind: string; description: string; hsn: string; quantity: number; unit: string; taxableValue: number; gstRate: number; taxAmount: number }[]
}

type Tailor = { id: string; name: string; city: string; stateCode: string; gstin: string | null; active: boolean }

type LineDraft = { kind: LineKind; description: string; hsn: string; quantity: string; unit: Unit; value: string; gstRate: number }

const newLine = (kind: LineKind = "FABRIC"): LineDraft => ({ kind, description: "", hsn: "", quantity: "", unit: kind === "TRIM" ? "PCS" : "MTR", value: "", gstRate: 5 })

const day = (iso: string | Date) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })

const label = "block font-jost text-xs font-semibold uppercase tracking-[0.12em] text-black/60"

export default function ChallansPanel<T extends { orderCode: string; status: string; items: OrderItemForChallan[]; challans: AdminChallan[] }>({
  order,
  onUpdated,
  onFlash,
}: {
  order: T
  onUpdated: (o: T) => void
  onFlash: (text: string) => void
}) {
  const items = useMemo(() => challanItems(order.items).filter((i) => i.needsChallan), [order.items])
  const used = useMemo(() => quantitiesOnChallans(order.challans), [order.challans])
  const left = items.map((i) => ({ ...i, left: i.quantity - (used.get(i.id) ?? 0) })).filter((i) => i.left > 0)
  const canIssue = (ISSUE_STATUSES as readonly string[]).includes(order.status) && left.length > 0
  const total = items.reduce((n, i) => n + i.quantity, 0)
  const back = order.challans
    .filter((c) => challanStatus(c) === "received")
    .reduce((n, c) => n + parsePieces(c.pieces).reduce((m, p) => m + p.quantity, 0), 0)

  const [issuing, setIssuing] = useState(false)
  const [receiving, setReceiving] = useState<AdminChallan | null>(null)
  const [cancelling, setCancelling] = useState<AdminChallan | null>(null)

  if (items.length === 0) {
    return (
      <Card title="Job work challans">
        <p className="font-jost text-sm text-black/60">This order has only accessories, so no challan is needed.</p>
      </Card>
    )
  }

  return (
    <Card
      title="Job work challans"
      action={
        canIssue && (
          <button type="button" onClick={() => setIssuing(true)} className={`${btn.secondary} !px-3 !py-1.5 !text-xs`}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> New challan
          </button>
        )
      }
    >
      <p className="font-jost text-sm text-black/70">
        {back} of {total} {total === 1 ? "piece" : "pieces"} back from the tailor.
        {left.length > 0 && ` ${left.reduce((n, i) => n + i.left, 0)} not on a challan yet.`}
      </p>
      {left.length > 0 && !canIssue && order.status !== "PROCESSING" && ["UNDER_VERIFICATION", "VERIFIED"].includes(order.status) && (
        <p className="mt-2 font-jost text-xs text-black/55">Start processing the order, buy the fabric in the business name, then issue a challan for each tailor.</p>
      )}

      {order.challans.length > 0 && (
        <ul className="mt-4 divide-y divide-black/5 border-t border-black/10">
          {[...order.challans].reverse().map((c) => {
            const status = challanStatus(c)
            const interState = c.tailorStateCode !== business.stateCode
            const soon = dueSoon(c)
            return (
              <li key={c.number} className="space-y-1 py-3 font-jost text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <a href={`/api/admin/challans/${challanSlug(c.number)}.pdf`} download className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4 hover:text-black/70">
                    <Download className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden /> {c.number}
                  </a>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      status === "received" ? "bg-emerald-50 text-emerald-800" : status === "cancelled" ? "bg-stone-100 text-black/50" : soon ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"
                    }`}
                  >
                    {status === "received" ? `Received back ${day(c.receivedAt!)}` : status === "cancelled" ? "Cancelled" : `With the tailor · due by ${day(returnDeadline(c.date))}`}
                  </span>
                </div>
                <p className="text-black/70">
                  {day(c.date)} · {c.tailorName}, {placeOfSupplyLabel(c.tailorStateCode)}
                  {c.tailorGstin ? ` · GSTIN ${c.tailorGstin}` : " · unregistered"}
                </p>
                <p className="text-black/70">Pieces: {challanPiecesText(parsePieces(c.pieces))}</p>
                <p className="text-xs text-black/55">
                  {challanLinesText(c.lines)} · value {formatRupeesExact(c.taxableValue)}
                  {c.fabricBill ? ` · bill ${c.fabricBill}` : ""}
                  {c.ewayBill ? ` · e-way bill ${c.ewayBill}` : ""}
                </p>
                {c.receivedNote && <p className="text-xs text-black/55">Came back: {c.receivedNote}{c.receivedEwayBill ? ` · e-way bill ${c.receivedEwayBill}` : ""}</p>}
                {c.cancelReason && <p className="text-xs text-black/55">Cancelled {c.cancelledAt ? day(c.cancelledAt) : ""}: {c.cancelReason}</p>}
                {status === "open" && interState && !c.ewayBill && (
                  <p className="text-xs text-amber-900">Inter-state movement: generate an e-way bill for sending and for the return, whatever the value.</p>
                )}
                {status === "open" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button type="button" onClick={() => setReceiving(c)} className={`${btn.primary} !px-3 !py-1.5 !text-xs`}>
                      Mark received back
                    </button>
                    <button type="button" onClick={() => setCancelling(c)} className={`${btn.ghost} !px-3 !py-1.5 !text-xs`}>
                      Cancel challan
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {issuing && (
        <IssueDialog
          orderCode={order.orderCode}
          pieces={left.map((i) => ({ id: i.id, name: i.name, detail: i.detail, left: i.left }))}
          onClose={() => setIssuing(false)}
          onDone={(o: T) => {
            setIssuing(false)
            onUpdated(o)
            const latest = o.challans[o.challans.length - 1]
            onFlash(latest ? `Challan ${latest.number} issued. Download the PDF and print it for the tailor.` : "Challan issued.")
          }}
        />
      )}
      {receiving && (
        <ReceiveDialog
          challan={receiving}
          onClose={() => setReceiving(null)}
          onDone={(o: T) => {
            onFlash(`Challan ${receiving.number} marked received back.`)
            setReceiving(null)
            onUpdated(o)
          }}
        />
      )}
      {cancelling && (
        <CancelDialog
          challan={cancelling}
          onClose={() => setCancelling(null)}
          onDone={(o: T) => {
            onFlash(`Challan ${cancelling.number} cancelled.`)
            setCancelling(null)
            onUpdated(o)
          }}
        />
      )}
    </Card>
  )
}

function IssueDialog<T>({
  orderCode,
  pieces,
  onClose,
  onDone,
}: {
  orderCode: string
  pieces: { id: string; name: string; detail: string; left: number }[]
  onClose: () => void
  onDone: (o: T) => void
}) {
  const [tailors, setTailors] = useState<Tailor[] | null>(null)
  const [tailorId, setTailorId] = useState("")
  const [qty, setQty] = useState<Record<string, string>>(() => Object.fromEntries(pieces.map((p) => [p.id, String(p.left)])))
  const [lines, setLines] = useState<LineDraft[]>([newLine()])
  const [fabricBill, setFabricBill] = useState("")
  const [ewayBill, setEwayBill] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminFetch<{ tailors: Tailor[] }>("/api/admin/tailors")
      .then((d) => {
        const active = d.tailors.filter((t) => t.active)
        setTailors(active)
        if (active.length === 1) setTailorId(active[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the tailors"))
  }, [])

  const tailor = tailors?.find((t) => t.id === tailorId)
  const interState = !!tailor && tailor.stateCode !== business.stateCode
  const setLine = (i: number, patch: Partial<LineDraft>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const value = lines.reduce((n, l) => n + (Math.round(Number(l.value) * 100) || 0), 0)

  const submit = async () => {
    setError(null)
    if (!tailorId) return setError("Choose the tailor")
    setSaving(true)
    try {
      const updated = await adminFetch<T>(`/api/admin/orders/${orderCode}/challans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tailorId,
          pieces: pieces.map((p) => ({ orderItemId: p.id, quantity: Number(qty[p.id]) || 0 })),
          lines: lines.map((l) => ({
            kind: l.kind,
            description: l.description,
            hsn: l.hsn,
            quantity: Number(l.quantity) || 0,
            unit: l.unit,
            value: Math.round(Number(l.value) * 100) || 0,
            gstRate: l.gstRate,
          })),
          fabricBill,
          ewayBill,
          note,
        }),
      })
      onDone(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not issue the challan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      size="lg"
      onClose={onClose}
      title="New job work challan"
      description="For fabric and other materials bought in the business name and sent to a tailor to stitch. The challan number is given when you issue it."
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary} disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={submit} className={btn.primary} disabled={saving || !tailors?.length}>
            {saving ? "Issuing…" : "Issue challan"}
          </button>
        </>
      }
    >
      <div className="space-y-5 font-jost text-sm">
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}

        <div>
          <label htmlFor="challan-tailor" className={label}>Tailor</label>
          {tailors && tailors.length === 0 ? (
            <p className="mt-2 text-black/70">
              No active tailors yet. <Link href="/admin/tailors" className="underline underline-offset-4">Add a tailor</Link> first.
            </p>
          ) : (
            <select id="challan-tailor" value={tailorId} onChange={(e) => setTailorId(e.target.value)} className={`${input} mt-2 w-full`} disabled={!tailors}>
              <option value="">{tailors ? "Choose the tailor" : "Loading…"}</option>
              {tailors?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}, {t.city} ({placeOfSupplyLabel(t.stateCode)}){t.gstin ? "" : " · unregistered"}
                </option>
              ))}
            </select>
          )}
          {interState && (
            <p className="mt-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
              This tailor is outside {business.state}. Generate an e-way bill for sending the fabric and another for the return, whatever the value, and send the finished pieces back to the studio: an unregistered tailor cannot ship to the customer.
            </p>
          )}
        </div>

        <fieldset>
          <legend className={label}>Pieces the tailor will make</legend>
          <ul className="mt-2 space-y-2">
            {pieces.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="block text-xs text-black/55">{p.detail}</span>
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={p.left}
                    value={qty[p.id] ?? ""}
                    onChange={(e) => setQty((q) => ({ ...q, [p.id]: e.target.value }))}
                    className={`${input} w-20 text-right`}
                    aria-label={`Quantity of ${p.name}`}
                  />
                  <span className="text-xs text-black/50">of {p.left}</span>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset>
          <legend className={label}>Goods sent</legend>
          <p className="mt-1 text-xs text-black/55">One line for each material: main fabric, a second fabric, lining, trims. Value is the taxable value on the purchase bill, without GST.</p>
          <div className="mt-3 space-y-3">
            {lines.map((l, i) => (
              <div key={i} className="rounded-lg border border-black/10 p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <select value={l.kind} onChange={(e) => setLine(i, { kind: e.target.value as LineKind })} className={`${input} col-span-1 sm:col-span-2`} aria-label="Type">
                    {LINE_KINDS.map((k) => (
                      <option key={k} value={k}>{LINE_KIND_LABEL[k]}</option>
                    ))}
                  </select>
                  <input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="e.g. Silk crepe, ivory" className={`${input} col-span-1 sm:col-span-4`} aria-label="Description" />
                  <input value={l.hsn} onChange={(e) => setLine(i, { hsn: e.target.value.replace(/\D/g, "").slice(0, 8) })} placeholder="HSN" inputMode="numeric" className={input} aria-label="HSN" />
                  <input value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} placeholder="Qty" inputMode="decimal" className={`${input} text-right`} aria-label="Quantity" />
                  <select value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value as Unit })} className={input} aria-label="Unit">
                    {UNITS.map((u) => (
                      <option key={u} value={u}>{UNIT_NAME[u]}</option>
                    ))}
                  </select>
                  <input value={l.value} onChange={(e) => setLine(i, { value: e.target.value })} placeholder="Value ₹" inputMode="decimal" className={`${input} text-right`} aria-label="Value in rupees" />
                  <select value={l.gstRate} onChange={(e) => setLine(i, { gstRate: Number(e.target.value) })} className={input} aria-label="GST rate">
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>GST {r}%</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                    disabled={lines.length === 1}
                    className={`${btn.ghost} !px-2`}
                    aria-label={`Remove line ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {(["FABRIC", "LINING", "TRIM"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setLines((ls) => [...ls, newLine(k)])} className={`${btn.secondary} !px-3 !py-1.5 !text-xs`} disabled={lines.length >= 20}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> {k === "FABRIC" ? "Another fabric" : LINE_KIND_LABEL[k]}
                </button>
              ))}
            </div>
            <span className="text-xs text-black/60">Value of goods {formatRupeesExact(value)}</span>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="challan-bill" className={label}>Purchase bill (optional)</label>
            <input id="challan-bill" value={fabricBill} onChange={(e) => setFabricBill(e.target.value)} placeholder="Seller and bill number" className={`${input} mt-2 w-full`} />
          </div>
          <div>
            <label htmlFor="challan-eway" className={label}>E-way bill{interState ? "" : " (optional)"}</label>
            <input id="challan-eway" value={ewayBill} onChange={(e) => setEwayBill(e.target.value)} placeholder="12-digit number" inputMode="numeric" className={`${input} mt-2 w-full`} />
          </div>
        </div>
        <div>
          <label htmlFor="challan-note" className={label}>Note for the tailor (optional)</label>
          <input id="challan-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. measurements sheet sent on WhatsApp" className={`${input} mt-2 w-full`} />
        </div>
      </div>
    </Dialog>
  )
}

function ReceiveDialog<T>({ challan, onClose, onDone }: { challan: AdminChallan; onClose: () => void; onDone: (o: T) => void }) {
  const today = istInputDate(new Date())
  const [date, setDate] = useState(today)
  const [note, setNote] = useState(() => receivedNoteFor(parsePieces(challan.pieces)))
  const [ewayBill, setEwayBill] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const interState = challan.tailorStateCode !== business.stateCode

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      onDone(
        await adminFetch<T>(`/api/admin/challans/${challanSlug(challan.number)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "received", date, note, ewayBill }),
        })
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Received back"
      description={`Challan ${challan.number} from ${challan.tailorName}. Copy what the tailor wrote on the challan when sending the pieces back.`}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary} disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={submit} className={btn.primary} disabled={saving}>
            {saving ? "Saving…" : "Mark received back"}
          </button>
        </>
      }
    >
      <div className="space-y-4 font-jost text-sm">
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
        <div>
          <label htmlFor="recv-date" className={label}>Date received</label>
          <input id="recv-date" type="date" value={date} min={istInputDate(challan.date)} max={today} onChange={(e) => setDate(e.target.value)} className={`${input} mt-2 w-full`} />
        </div>
        <div>
          <label htmlFor="recv-note" className={label}>Goods received back</label>
          <textarea id="recv-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={`${input} mt-2 w-full`} />
        </div>
        <div>
          <label htmlFor="recv-eway" className={label}>E-way bill for the return{interState ? "" : " (optional)"}</label>
          <input id="recv-eway" value={ewayBill} onChange={(e) => setEwayBill(e.target.value)} placeholder="12-digit number" inputMode="numeric" className={`${input} mt-2 w-full`} />
        </div>
      </div>
    </Dialog>
  )
}

function CancelDialog<T>({ challan, onClose, onDone }: { challan: AdminChallan; onClose: () => void; onDone: (o: T) => void }) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      onDone(
        await adminFetch<T>(`/api/admin/challans/${challanSlug(challan.number)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cancel", reason }),
        })
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      size="sm"
      onClose={onClose}
      title="Cancel challan"
      description={`Use this only if challan ${challan.number} was issued by mistake and the goods did not go to the tailor. The number stays in the register, marked cancelled.`}
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary} disabled={saving}>
            Keep it
          </button>
          <button type="button" onClick={submit} className={btn.danger} disabled={saving}>
            {saving ? "Cancelling…" : "Cancel challan"}
          </button>
        </>
      }
    >
      <div className="space-y-3 font-jost text-sm">
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
        <label htmlFor="cancel-reason" className={label}>Reason</label>
        <input id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. wrong tailor chosen" className={`${input} w-full`} />
      </div>
    </Dialog>
  )
}
