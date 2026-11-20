"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"
import { Dialog, btn, input } from "@/components/admin/ui"
import { adminStatusLabel, statusEmailSubject } from "@/lib/orders/labels"
import type { Transition } from "@/lib/orders/transitions"
import { adminFetch } from "@/lib/admin/fetch"
import { formatRupeesExact } from "@/lib/money"

export type StatusChangeTarget = {
  orderCode: string
  status: string
  customerEmail: string | null
  credit?: CreditTarget | null
}

export type CreditTarget = {
  invoiceNumber: string
  deadline: string
  deadlinePassed: boolean
  items: { id: string; name: string; detail: string; remaining: number; unitAmount: number }[]
}

export default function StatusChangeDialog<T = unknown>({
  target,
  transition,
  onClose,
  onDone,
  onError,
}: {
  target: StatusChangeTarget | null
  transition: Transition | null
  onClose: () => void
  onDone: (updated: T, summary: string) => void
  onError: (message: string) => void
}) {
  const open = Boolean(target && transition)
  const [note, setNote] = useState("")
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [reason, setReason] = useState("")

  const credit = transition?.to === "REFUNDED" && target?.credit ? target.credit : null
  const issuing = Boolean(credit && !credit.deadlinePassed)
  const creditAmount = credit ? credit.items.reduce((s, i) => s + Math.round(i.unitAmount * (quantities[i.id] ?? 0)), 0) : 0
  const creditCount = Object.values(quantities).reduce((s, q) => s + q, 0)

  useEffect(() => {
    if (open) {
      setNote("")
      setNotify(Boolean(target?.customerEmail))
      setQuantities(Object.fromEntries((target?.credit?.items ?? []).map((i) => [i.id, i.remaining])))
      setReason("Goods returned")
    }
  }, [open, target?.customerEmail, target?.credit])

  const confirm = async () => {
    if (!target || !transition) return
    setSaving(true)
    try {
      const updated = await adminFetch<T>(`/api/admin/orders/${target.orderCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          status: transition.to,
          note: note.trim() || undefined,
          notifyCustomer: notify,
          creditNote: issuing
            ? { reason: reason.trim(), items: Object.entries(quantities).map(([orderItemId, quantity]) => ({ orderItemId, quantity })) }
            : undefined,
        }),
      })
      const emailed = notify && target.customerEmail
      onDone(updated, `Order ${target.orderCode} marked ${adminStatusLabel(transition.to).toLowerCase()}${issuing ? " and a credit note issued" : ""}${emailed ? ". Customer emailed." : "."}`)
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not update the order.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      title={transition?.label ?? ""}
      description={transition?.description}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={btn.secondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={saving || Boolean(transition?.noteRequired && !note.trim()) || (issuing && (creditCount === 0 || !reason.trim()))}
            className={`${transition?.intent === "danger" ? btn.danger : btn.primary} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {saving ? "Saving…" : transition?.label}
          </button>
        </>
      }
    >
      {target && transition && (
        <div className="space-y-4 font-jost text-sm">
          <p className="flex flex-wrap items-center gap-2 text-black/70">
            <span className="font-semibold tracking-wide text-black">{target.orderCode}</span>
            <StatusBadge status={target.status} />
            <span aria-hidden>→</span>
            <StatusBadge status={transition.to} />
          </p>
          {credit && credit.deadlinePassed && (
            <p className="rounded-md bg-amber-50 p-3 text-amber-900">
              The last date for a GST credit note against invoice {credit.invoiceNumber} was {credit.deadline}, so the refund is recorded without one. GST already paid on this invoice is not reduced.
            </p>
          )}
          {issuing && credit && (
            <div className="space-y-3 rounded-md border border-black/10 p-3">
              <p>
                <span className="font-semibold">Credit note</span> against tax invoice {credit.invoiceNumber}. Choose what is refunded.
              </p>
              <ul className="space-y-2">
                {credit.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{i.name}</span>
                      <span className="block text-xs text-black/55">{i.detail} · {formatRupeesExact(Math.round(i.unitAmount))} each</span>
                    </span>
                    {i.remaining > 0 ? (
                      <select
                        aria-label={`Quantity of ${i.name} to credit`}
                        value={quantities[i.id] ?? 0}
                        onChange={(e) => setQuantities((q) => ({ ...q, [i.id]: Number(e.target.value) }))}
                        className={`${input} !py-1.5`}
                      >
                        {Array.from({ length: i.remaining + 1 }, (_, n) => (
                          <option key={n} value={n}>
                            {n} of {i.remaining}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-black/50">Already credited</span>
                    )}
                  </li>
                ))}
              </ul>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Reason (on the credit note)</span>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} className={`${input} mt-1.5 w-full`} />
              </label>
              <p className="flex justify-between border-t border-black/10 pt-2 font-semibold">
                <span>Credit note value, GST included</span>
                <span className="tabular-nums">{formatRupeesExact(creditAmount)}</span>
              </p>
              <p className="text-xs text-black/50">The credit note number, date, and the CGST and SGST or IGST are worked out when you confirm.</p>
            </div>
          )}
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">
              History note{transition.noteRequired ? " (required)" : " (optional)"}
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder={transition.notePlaceholder ?? "Details for the order history"}
              required={transition.noteRequired}
              className={`${input} mt-1.5 w-full`}
            />
            <span className="mt-1 block text-xs text-black/45">Recorded in the order history. Not sent to the customer.</span>
          </label>
          {target.customerEmail ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 p-3">
              <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-black/30 checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                />
                <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
              </span>
              <span>
                <span className="font-medium">Email the customer</span>
                <span className="mt-0.5 block text-xs text-black/55">
                  “{statusEmailSubject(transition.to, target.orderCode)}” to {target.customerEmail}
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs text-black/50">No email on this order, so the customer will not be notified.</p>
          )}
        </div>
      )}
    </Dialog>
  )
}
