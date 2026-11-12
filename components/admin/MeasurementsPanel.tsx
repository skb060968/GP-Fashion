"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, MessageCircle, Pencil, Ruler } from "lucide-react"
import { btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import {
  KIND_LABEL,
  fieldLabel,
  fieldsFor,
  formatInches,
  parseMeasurement,
  snapshotLines,
  type MeasurementSnapshot,
} from "@/lib/measurements/fields"

export const MEASUREMENT_EDIT_STATUSES = ["UNDER_VERIFICATION", "VERIFIED"]

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })

export default function MeasurementsPanel<T>({
  orderCode,
  status,
  itemId,
  itemName,
  snapshot,
  confirmedAt,
  confirmNote,
  customerFirstName,
  waNumber,
  onUpdated,
  onError,
}: {
  orderCode: string
  status: string
  itemId: string
  itemName: string
  snapshot: MeasurementSnapshot
  confirmedAt: string | null
  confirmNote: string | null
  customerFirstName: string
  waNumber: string
  onUpdated: (order: T, message: string) => void
  onError: (message: string) => void
}) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view")
  const [text, setText] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [fieldError, setFieldError] = useState("")

  const editable = MEASUREMENT_EDIT_STATUSES.includes(status)
  const fields = fieldsFor(snapshot.kind)
  const lines = snapshotLines(snapshot)

  const startEdit = () => {
    setText(Object.fromEntries(fields.map((f) => [f.key, typeof snapshot.values[f.key] === "number" ? formatInches(snapshot.values[f.key], "") : ""])))
    setNotes(snapshot.notes ?? "")
    setFieldError("")
    setMode("edit")
  }

  const patch = async (body: Record<string, unknown>, message: string) => {
    setBusy(true)
    try {
      const updated = await adminFetch<T>(`/api/admin/orders/${orderCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      setMode("view")
      onUpdated(updated, message)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not save"
      if (mode === "edit") setFieldError(msg)
      else onError(msg)
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = () => {
    const values: Record<string, number> = {}
    for (const f of fields) {
      const s = (text[f.key] ?? "").trim()
      if (!s) continue
      const v = parseMeasurement(s, "in")
      if (v === null) {
        setFieldError(`${fieldLabel(f, snapshot.kind)}: enter inches, e.g. 36.5 or 36 1/2`)
        return
      }
      values[f.key] = v
    }
    patch({ action: "measurements", itemId, values, notes }, "Measurements updated. Confirm them again before processing.")
  }

  const waText = [
    `Hello ${customerFirstName}, this is Piyush Bholla about your order ${orderCode}.`,
    `Before we cut your made-to-measure ${itemName}, please confirm these measurements for ${snapshot.name}:`,
    "",
    ...lines.map((l) => `${l.label}: ${l.value}`),
    ...(snapshot.notes ? ["", `Fit notes: ${snapshot.notes}`] : []),
    "",
    "Reply YES if they are correct, or send any changes.",
  ].join("\n")

  return (
    <div className="mt-3 rounded-lg border border-black/10 bg-stone-50/60 p-4 font-jost text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">
          Made to measure · {snapshot.name} <span className="font-normal text-black/55">({KIND_LABEL[snapshot.kind]})</span>
        </p>
        {confirmedAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> Confirmed {fmtDate(confirmedAt)}
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Not confirmed</span>
        )}
      </div>
      {confirmedAt && confirmNote && <p className="mt-1 text-xs text-black/55">{confirmNote}</p>}

      {mode === "edit" ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-black/55">Inches. This changes the order&apos;s copy only, not the customer&apos;s saved profile. Leave a box empty to use the chart value.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-black/60">
                  {fieldLabel(f, snapshot.kind)}
                  {f.required ? " *" : ""}
                </span>
                <input
                  value={text[f.key] ?? ""}
                  onChange={(e) => {
                    setText((t) => ({ ...t, [f.key]: e.target.value }))
                    setFieldError("")
                  }}
                  inputMode="decimal"
                  className={`${input} mt-1 w-full`}
                />
              </label>
            ))}
          </div>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-black/60">Fit notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} className={`${input} mt-1 w-full resize-y`} />
          </label>
          {fieldError && <p role="alert" className="text-xs text-red-700">{fieldError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMode("view")} disabled={busy} className={btn.secondary}>Cancel</button>
            <button type="button" onClick={saveEdit} disabled={busy} className={btn.primary}>{busy ? "Saving…" : "Save changes"}</button>
          </div>
        </div>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {lines.map((l) => (
              <div key={l.label} className="flex justify-between gap-3 border-b border-black/5 py-1">
                <dt className="text-black/60">{l.label}</dt>
                <dd className="tabular-nums">{l.value}</dd>
              </div>
            ))}
          </dl>
          {snapshot.notes && (
            <p className="mt-3 text-black/70">
              <span className="font-semibold text-black">Fit notes:</span> {snapshot.notes}
            </p>
          )}

          {mode === "confirm" ? (
            <div className="mt-4 space-y-2">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                placeholder="How it was confirmed, e.g. WhatsApp reply 12 Nov"
                className={`${input} w-full`}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setMode("view")} disabled={busy} className={btn.secondary}>Cancel</button>
                <button
                  type="button"
                  onClick={() => patch({ action: "confirm-measurements", itemId, note }, `Measurements for ${snapshot.name} confirmed.`)}
                  disabled={busy}
                  className={btn.primary}
                >
                  {busy ? "Saving…" : "Confirm measurements"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {waNumber && (
                <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener" className={btn.secondary}>
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Send on WhatsApp
                </a>
              )}
              {editable && (
                <button type="button" onClick={startEdit} className={btn.secondary}>
                  <Pencil className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Edit
                </button>
              )}
              {editable && !confirmedAt && (
                <button
                  type="button"
                  onClick={() => {
                    setNote("")
                    setMode("confirm")
                  }}
                  className={btn.primary}
                >
                  <Check className="h-4 w-4" strokeWidth={2} aria-hidden /> Confirm
                </button>
              )}
              <Link href={`/admin/measure?order=${encodeURIComponent(orderCode)}&item=${encodeURIComponent(itemId)}`} className={btn.secondary}>
                <Ruler className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Open in Measurements
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
