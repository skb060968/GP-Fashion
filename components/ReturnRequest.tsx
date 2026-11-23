"use client"

import { useState } from "react"
import { AlertCircle, Check, RotateCcw } from "lucide-react"
import { contact } from "@/lib/data/contact"
import {
  PHOTO_REASONS,
  REFUND_REASONS,
  RETURN_REASONS,
  RETURN_RESOLUTIONS,
  type Returnable,
  type ReturnReason,
  type ReturnResolution,
} from "@/lib/orders/returns"

export type LastReturn = {
  reason: string
  resolution: string
  items: string[]
  note: string | null
  photos: boolean
  createdAt: string
}

const fmtDate = (iso: string) =>
  new Date(new Date(iso).getTime() - 1).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long" })

const radio =
  "peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-black/30 checked:border-[5px] checked:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
const select = "rounded-lg border border-black/15 bg-white px-3 py-2 font-jost text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"

export function ReturnSummary({ r, status }: { r: LastReturn; status: string }) {
  if (status !== "RETURN_REQUESTED") return null
  return (
    <div className="mt-6 rounded-lg border border-black/10 bg-stone-50 p-4 font-jost text-sm text-black/75">
      <p className="font-semibold text-black">
        {r.resolution} · {r.reason}
      </p>
      <ul className="mt-1">
        {r.items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <p className="mt-3">
        We will reply within two working days to confirm and tell you how to send the piece back. Keep it unworn with all tags attached.
      </p>
      {r.photos && (
        <p className="mt-2">
          Please send photos of the piece and its tags on WhatsApp to {contact.phone}, or reply to our email with them attached.
        </p>
      )}
    </div>
  )
}

export default function ReturnRequest({
  orderCode,
  accessToken,
  returnable,
  onDone,
}: {
  orderCode: string
  accessToken?: string
  returnable: Returnable
  onDone: () => void
}) {
  const [open, setOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [sizes, setSizes] = useState<Record<string, string>>({})
  const [reason, setReason] = useState<ReturnReason | "">("")
  const [resolution, setResolution] = useState<ReturnResolution | "">("")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const chosen = returnable.items.filter((i) => (quantities[i.id] ?? 0) > 0)
  const refundAllowed = reason !== "" && REFUND_REASONS.includes(reason)
  const sizeMissing = resolution === "SIZE" && chosen.some((i) => !sizes[i.id])
  const noteMissing = resolution === "PIECE" && !note.trim()
  const ready = chosen.length > 0 && reason !== "" && resolution !== "" && !sizeMissing && !noteMissing

  const pickReason = (r: ReturnReason) => {
    setReason(r)
    if (resolution === "REFUND" && !REFUND_REASONS.includes(r)) setResolution("")
    if (r === "WRONG_SIZE" && resolution === "") setResolution("SIZE")
    if (r === "OTHER_PIECE" && resolution === "") setResolution("PIECE")
  }

  const submit = async () => {
    if (!ready || sending) return
    setSending(true)
    setError("")
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderCode)}/return${accessToken ? `?t=${accessToken}` : ""}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          resolution,
          note: note.trim() || undefined,
          items: chosen.map((i) => ({ orderItemId: i.id, quantity: quantities[i.id], ...(resolution === "SIZE" ? { exchangeSize: sizes[i.id] } : {}) })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "We couldn't send your request. Please try again.")
        return
      }
      onDone()
    } catch {
      setError("We couldn't send your request. Please check your connection and try again.")
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <div className="mt-6 flex flex-col items-start gap-2 rounded-lg border border-black/10 p-4 font-jost text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-black/70">Need a different size or piece? You can ask until {fmtDate(returnable.deadline)}.</p>
        <button type="button" onClick={() => setOpen(true)} className="btn-outline-dark !px-5 !py-2 !text-xs">
          <RotateCcw className="mr-1.5 inline h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Request an exchange
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6 rounded-lg border border-black/15 p-5 font-jost text-sm">
      <div>
        <h3 className="font-cinzel text-base font-bold uppercase tracking-[0.12em]">Request an exchange</h3>
        <p className="mt-1 text-black/60">
          Pieces must be unworn, with all tags attached. Made-to-measure pieces cannot be returned. Request by {fmtDate(returnable.deadline)}.
        </p>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Which pieces?</legend>
        <ul className="mt-3 space-y-3">
          {returnable.items.map((i) => {
            const qty = quantities[i.id] ?? 0
            return (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex min-w-0 cursor-pointer items-start gap-3">
                  <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={qty > 0}
                      onChange={(e) => setQuantities((q) => ({ ...q, [i.id]: e.target.checked ? 1 : 0 }))}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-black/30 checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    />
                    <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold">{i.name}</span>
                    <span className="block text-xs text-black/60">
                      Size {i.size}
                      {i.color ? ` · ${i.color}` : ""}
                    </span>
                  </span>
                </label>
                {qty > 0 && (
                  <span className="flex flex-wrap items-center gap-2">
                    {i.quantity > 1 && (
                      <select
                        aria-label={`How many of ${i.name}`}
                        value={qty}
                        onChange={(e) => setQuantities((q) => ({ ...q, [i.id]: Number(e.target.value) }))}
                        className={select}
                      >
                        {Array.from({ length: i.quantity }, (_, n) => (
                          <option key={n + 1} value={n + 1}>
                            {n + 1} of {i.quantity}
                          </option>
                        ))}
                      </select>
                    )}
                    {resolution === "SIZE" &&
                      (i.sizes.length ? (
                        <select
                          aria-label={`New size for ${i.name}`}
                          value={sizes[i.id] ?? ""}
                          onChange={(e) => setSizes((s) => ({ ...s, [i.id]: e.target.value }))}
                          className={select}
                        >
                          <option value="" disabled>
                            New size
                          </option>
                          {i.sizes.map((s) => (
                            <option key={s} value={s}>
                              Size {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-black/55">No other size. Choose a different piece instead.</span>
                      ))}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Why?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(Object.keys(RETURN_REASONS) as ReturnReason[]).map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-3">
              <input type="radio" name={`reason-${orderCode}`} checked={reason === r} onChange={() => pickReason(r)} className={radio} />
              {RETURN_REASONS[r]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.15em] text-black/70">What would you like?</legend>
        <div className="mt-3 grid gap-2">
          {(Object.keys(RETURN_RESOLUTIONS) as ReturnResolution[]).map((r) => {
            const disabled = r === "REFUND" && !refundAllowed
            return (
              <label key={r} className={`flex items-center gap-3 ${disabled ? "cursor-not-allowed text-black/40" : "cursor-pointer"}`}>
                <input type="radio" name={`resolution-${orderCode}`} checked={resolution === r} disabled={disabled} onChange={() => setResolution(r)} className={radio} />
                {RETURN_RESOLUTIONS[r]}
                {r === "REFUND" && <span className="text-xs text-black/50">Only for a damaged piece or a wrong item</span>}
              </label>
            )
          })}
        </div>
      </fieldset>

      <label className="block">
        <span className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/70">
            {resolution === "PIECE" ? "Which piece would you like instead?" : "Anything else we should know?"}
          </span>
          {resolution !== "PIECE" && <span className="text-xs text-black/40">Optional</span>}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          className="mt-2 w-full rounded-lg border border-black/15 bg-white px-4 py-3 font-jost text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </label>

      {reason !== "" && PHOTO_REASONS.includes(reason) && (
        <p className="rounded-lg bg-stone-50 p-3 text-black/70">
          After sending this, please share photos of the piece and its tags on WhatsApp to {contact.phone}, or reply to our confirmation email with them attached.
        </p>
      )}
      <p className="text-xs text-black/55">
        Return shipping is at your cost, unless the piece arrived damaged or we sent the wrong item. We reply within two working days to arrange it.
      </p>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => setOpen(false)} disabled={sending} className="font-jost text-sm text-black/60 underline-offset-4 hover:text-black hover:underline">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!ready || sending}
          className="btn-solid-dark !px-6 !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white"
        >
          {sending ? "Sending…" : "Send request"}
        </button>
      </div>
    </div>
  )
}
